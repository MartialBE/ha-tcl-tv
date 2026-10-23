"""TCL TV control over the TCL+/T-Cast LAN remote protocol (TCP 6553)."""
from __future__ import annotations

import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.loader import async_get_integration

from .const import DOMAIN, PLATFORMS
from .entity import tv_errors
from .hub import TclTvHub

TclTvConfigEntry = ConfigEntry[TclTvHub]

_LOGGER = logging.getLogger(__name__)
CARD_PATH = "/tcl_tv_static/tcl-ipod-card.js"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve the card, register services, and register it in the dashboard's resource collection."""
    
    async def async_handle_homekit_remote_key(event) -> None:
        """Handle HomeKit TV remote key press events automatically."""
        # Map HomeKit key names to TCL remote commands
        key_mapping = {
            "arrow_up": "up",
            "arrow_down": "down",
            "arrow_left": "left",
            "arrow_right": "right",
            "select": "ok",
            "back": "back",
            "play_pause": "playback",
            "information": "info",
        }
        
        entity_id = event.data.get("entity_id")
        key_name = event.data.get("key_name")
        
        # Only handle events for our media_player entities
        if not entity_id or not entity_id.startswith(f"media_player.{DOMAIN}_"):
            return
            
        tcl_command = key_mapping.get(key_name)
        if not tcl_command:
            return
        
        # Find the corresponding remote entity
        # media_player.tcl_tv_xxx -> remote.tcl_tv_xxx_remote
        remote_id = entity_id.replace("media_player.", "remote.") + "_remote"
        
        # Call remote.send_command
        await hass.services.async_call(
            "remote",
            "send_command",
            {"entity_id": remote_id, "command": tcl_command},
            blocking=True,
        )
    
    # Register HomeKit remote key event listener
    hass.bus.async_listen("homekit_tv_remote_key_pressed", async_handle_homekit_remote_key)
    
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
            # Extract the device from entity registry
            import homeassistant.helpers.entity_registry as er
            entity_registry = er.async_get(hass)
            entity_entry = entity_registry.async_get(entity_id)
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
