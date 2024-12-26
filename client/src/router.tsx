import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import EventsPage from "./features/events/pages/EventsPage";
import EventFormPage from "./features/events/pages/EventFormPage";
import EventDetailsPage from "./features/events/pages/EventDetailsPage";
import RSVPPage from "./features/events/pages/RSVPPage";
import LoginPage from "./features/auth/pages/LoginPage";
import Agents from "./features/agents/Agents";
import Agent from "./features/agents/Agent";
import Chat from "./features/agents/Chat";
import Character from "./features/agents/Character";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/rsvp/:inviteId",
        element: <RSVPPage />,
    },
    // AI Agent routes
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <Agents />
            </ProtectedRoute>
        ),
    },
    {
        path: "/:agentId",
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "",
                element: <Agent />,
            },
            {
                path: "chat",
                element: <Chat />,
            },
            {
                path: "character",
                element: <Character />,
            },
        ],
    },

    // Event Management routes
    {
        path: "/events",
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "",
                element: <EventsPage />,
            },
            {
                path: "new",
                element: <EventFormPage />,
            },
            {
                path: ":id",
                element: <EventDetailsPage />,
            },
            {
                path: ":id/edit",
                element: <EventFormPage />,
            },
        ],
    },
]);
