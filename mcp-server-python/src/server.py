"""
Web Intelligence MCP Server (Python)

A Model Context Protocol server for web intelligence operations
including lead generation, data scraping, and business intelligence.
"""
import os
import sys
import json
import asyncio
from typing import Any, Dict, List, Sequence
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel,
)

from find_leads import find_leads, find_leads_next_page, check_configuration, LeadGenerationError

# Server metadata
SERVER_NAME = "web-intelligence-mcp"
SERVER_VERSION = "1.0.0"

# Create server instance
app = Server(SERVER_NAME)


@app.list_tools()
async def list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="find_leads",
            description="""Search for business leads using Google Maps data.

Finds businesses matching a keyword within a specified radius of a location.
Returns structured business data including name, address, phone, website, rating, and more.

Examples:
- Find restaurants in New York: {"keyword": "restaurant", "location": "New York, NY"}
- Find dentists with 10km radius: {"keyword": "dentist", "location": "Los Angeles, CA", "radius": 10000}
- Get detailed info: {"keyword": "plumber", "location": "Chicago, IL", "include_details": true}""",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "Business type or search keyword (e.g., \"restaurant\", \"dentist\", \"plumber\")",
                    },
                    "location": {
                        "type": "string",
                        "description": "Location to search around (e.g., \"New York, NY\", \"123 Main St, Boston\")",
                    },
                    "radius": {
                        "type": "number",
                        "description": "Search radius in meters (default: 5000, min: 100, max: 50000)",
                        "minimum": 100,
                        "maximum": 50000,
                        "default": 5000,
                    },
                    "max_results": {
                        "type": "number",
                        "description": "Maximum number of results to return (default: 20)",
                        "minimum": 1,
                        "maximum": 60,
                        "default": 20,
                    },
                    "include_details": {
                        "type": "boolean",
                        "description": "Include detailed information (phone, website, hours) - requires additional API calls",
                        "default": False,
                    },
                },
                "required": ["keyword", "location"],
            },
        ),
        Tool(
            name="find_leads_next_page",
            description="Get the next page of results from a previous find_leads search",
            inputSchema={
                "type": "object",
                "properties": {
                    "next_page_token": {
                        "type": "string",
                        "description": "The next_page_token from a previous find_leads response",
                    },
                    "keyword": {
                        "type": "string",
                        "description": "Original search keyword",
                    },
                    "location": {
                        "type": "string",
                        "description": "Original search location",
                    },
                    "radius": {
                        "type": "number",
                        "description": "Original search radius",
                        "default": 5000,
                    },
                    "max_results": {
                        "type": "number",
                        "description": "Maximum results to return",
                        "default": 20,
                    },
                },
                "required": ["next_page_token", "keyword", "location"],
            },
        ),
        Tool(
            name="check_lead_generation_config",
            description="Check the configuration status of the lead generation tool",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
    """Handle tool calls"""
    try:
        if name == "find_leads":
            result = await find_leads(
                keyword=arguments["keyword"],
                location=arguments["location"],
                radius=arguments.get("radius"),
                max_results=arguments.get("max_results"),
                include_details=arguments.get("include_details", False),
            )
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "find_leads_next_page":
            result = await find_leads_next_page(
                next_page_token=arguments["next_page_token"],
                keyword=arguments["keyword"],
                location=arguments["location"],
                radius=arguments.get("radius"),
                max_results=arguments.get("max_results"),
            )
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "check_lead_generation_config":
            result = await check_configuration()
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        else:
            return [TextContent(type="text", text=json.dumps({
                "error": True,
                "message": f"Unknown tool: {name}",
            }, indent=2))]
    
    except LeadGenerationError as e:
        return [TextContent(type="text", text=json.dumps({
            "error": True,
            "message": str(e),
            "code": e.code,
            "tool": name,
        }, indent=2))]
    
    except Exception as e:
        return [TextContent(type="text", text=json.dumps({
            "error": True,
            "message": str(e),
            "tool": name,
        }, indent=2))]


async def main():
    """Main entry point"""
    # Check configuration on startup
    config = await check_configuration()
    print(f"Configuration: {config['message']}", file=sys.stderr)
    
    # Run server
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
