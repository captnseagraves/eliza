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
import { AuthProvider } from "./lib/auth";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
};

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AuthLayout><Layout /></AuthLayout>,
        children: [
            {
                index: true,
                element: (
                    <ProtectedRoute>
                        <Agents />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/agents/:agentId",
                element: <ProtectedRoute><Agent /></ProtectedRoute>,
            },
            {
                path: "/agents/:agentId/chat",
                element: <ProtectedRoute><Chat /></ProtectedRoute>,
            },
            {
                path: "/agents/:agentId/character",
                element: <ProtectedRoute><Character /></ProtectedRoute>,
            },
            // Event Management routes
            {
                path: "/events",
                element: <ProtectedRoute><EventsPage /></ProtectedRoute>,
            },
            {
                path: "/events/new",
                element: <ProtectedRoute><EventFormPage /></ProtectedRoute>,
            },
            {
                path: "/events/:id",
                element: <ProtectedRoute><EventDetailsPage /></ProtectedRoute>,
            },
            {
                path: "/events/:id/edit",
                element: <ProtectedRoute><EventFormPage /></ProtectedRoute>,
            },
        ],
    },
    {
        path: "/login",
        element: <AuthLayout><LoginPage /></AuthLayout>,
    },
    {
        path: "/rsvp/:inviteId",
        element: <AuthLayout><RSVPPage /></AuthLayout>,
    },
]);
