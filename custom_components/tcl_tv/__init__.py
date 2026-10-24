"""TCL TV control over the TCL+/T-Cast LAN remote protocol (TCP 6553)."""
from __future__ import annotations

import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration

from .const import DOMAIN, PLATFORMS
from .entity import tv_errors
from .hub import TclTvHub
from .protocol import KEYS

TclTvConfigEntry = ConfigEntry[TclTvHub]

_LOGGER = logging.getLogger(__name__)
CARD_PATH = "/tcl_tv_static/tcl-ipod-card.js"

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

HOMEKIT_KEYS = {
    "arrow_up": "up",
    "arrow_down": "down",
    "arrow_left": "left",
    "arrow_right": "right",
    "select": "ok",
    "back": "back",
    "play_pause": "ok",
    "information": "menu",
}


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve the card, register services, and register it in the dashboard's resource collection."""
    
    async def async_handle_homekit_remote_key(event: Event) -> None:
        """Forward HomeKit TV remote keys to the TV that owns the entity."""
        entity_id = event.data.get("entity_id")
        tcl_key = HOMEKIT_KEYS.get(event.data.get("key_name", ""))
        if not entity_id or tcl_key is None:
            return
        registered = er.async_get(hass).async_get(entity_id)
        if (
            registered is None
            or registered.platform != DOMAIN
            or registered.config_entry_id is None
        ):
            return
        entry = hass.config_entries.async_get_entry(registered.config_entry_id)
        if entry is None or entry.runtime_data is None:
            return
        hub: TclTvHub = entry.runtime_data
        _LOGGER.debug("HomeKit %s -> %s (%s)", event.data["key_name"], tcl_key, entity_id)
        try:
            with tv_errors():
                await hub.require_client().send_key(KEYS[tcl_key])
        except HomeAssistantError as err:
            _LOGGER.warning("HomeKit key %s on %s failed: %s", tcl_key, entity_id, err)
    
    # Register HomeKit remote key event listener
    hass.bus.async_listen("homekit_tv_remote_key_pressed", async_handle_homekit_remote_key)
    _LOGGER.debug("HomeKit remote key forwarding registered")
    
    async def async_send_text(call: ServiceCall) -> None:
        """Send text to the TV via IME (message ID 155)."""
        text: str = call.data["text"]
        
        # Find all TCL TV entries
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            raise ServiceValidationError("No TCL TV configured")
        
        # If entity_id is provided, find the matching entry
        if "entity_id" in call.data:
            entity_id = call.data["entity_id"]
            entity_entry = er.async_get(hass).async_get(entity_id)
            if not entity_entry:
                raise ServiceValidationError(f"Entity {entity_id} not found")
            
            # Find the config entry for this entity
            entry = next(
                (e for e in entries if e.entry_id == entity_entry.config_entry_id),
                None
            )
            if not entry:
                raise ServiceValidationError(f"Config entry for {entity_id} not found")
            entries = [entry]
        
        # Send text to all matched TVs
        for entry in entries:
            hub: TclTvHub = entry.runtime_data
            with tv_errors():
                client = hub.require_client()
                await client.send_text(text)
    
    hass.services.async_register(
        DOMAIN,
        "send_text",
        async_send_text,
        schema=vol.Schema({
            vol.Required("text"): cv.string,
            vol.Optional("entity_id"): cv.entity_id,
        }),
    )
    component_dir = Path(__file__).parent
    integration = await async_get_integration(hass, DOMAIN)
    card_url = f"{CARD_PATH}?v={integration.version}"
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                "/tcl_tv_static",
                str(component_dir / "static"),
                False,
            )
        ]
    )
    resources = hass.data[LOVELACE_DATA].resources
    # Loading via the HTML bootstrap alone misses clients that reuse that page.
    # Lovelace resources are fetched separately and work without the extra import.
    if isinstance(resources, ResourceStorageCollection):
        await resources.async_get_info()  # Ensure persisted resources are loaded.
        matches = [
            item for item in resources.async_items()
            if item["url"].split("?", 1)[0] == CARD_PATH
        ]
        resource = {"url": card_url, "res_type": "module"}
        if matches:
            if matches[0]["url"] != card_url or matches[0]["type"] != "module":
                await resources.async_update_item(matches[0]["id"], resource)
            for duplicate in matches[1:]:
                await resources.async_delete_item(duplicate["id"])
        else:
            await resources.async_create_item(resource)
    elif not any(
        item["url"] == card_url and item["type"] == "module"
        for item in resources.async_items()
    ):
        _LOGGER.warning(
            "Lovelace resources are YAML-managed: add url: %s with type: module",
            card_url,
        )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: TclTvConfigEntry) -> bool:
    hub = TclTvHub(entry)
    entry.runtime_data = hub
    # A powered-off TV is a normal state, not a setup failure: entities report
    # "off" until the session comes up.
    entry.async_create_background_task(hass, hub.async_run(), f"tcl_tv {hub.host}")
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: TclTvConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded and entry.runtime_data.client is not None:
        await entry.runtime_data.client.close()
    return unloaded
