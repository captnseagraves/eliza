import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarSection } from "@/components/ui/sidebar";

// Menu items.
const items = [
    {
        title: "Chat",
        url: "chat",
        icon: Inbox,
    },
    {
        title: "Character Overview",
        url: "character",
        icon: Calendar,
    },
];

export function AppSidebar() {
    const { agentId } = useParams();

    return (
        <Sidebar>
            {/* AI Agent Navigation */}
            <SidebarSection>
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/">← Back to Agents</Link>
                    </Button>
                </div>
                {agentId && (
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                        >
                            <Link to={`/${agentId}`}>Agent Info</Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                        >
                            <Link to={`/${agentId}/chat`}>Chat</Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                        >
                            <Link to={`/${agentId}/character`}>Character</Link>
                        </Button>
                    </div>
                )}
            </SidebarSection>

            {/* Event Navigation */}
            <SidebarSection>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Events
                </h2>
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/events">All Events</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                    >
                        <Link to="/events/new">Create Event</Link>
                    </Button>
                </div>
            </SidebarSection>
        </Sidebar>
    );
}
