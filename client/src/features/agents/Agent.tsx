import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Agent() {
    const navigate = useNavigate();
    const { agentId } = useParams();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-8">What would you like to do?</h1>
            <div className="grid gap-4 w-full max-w-md">
                <Button
                    className="w-full"
                    onClick={() => navigate(`/agents/${agentId}/chat`)}
                >
                    Chat with Agent
                </Button>
                <Button
                    className="w-full"
                    onClick={() => navigate(`/agents/${agentId}/character`)}
                >
                    View Character Details
                </Button>
            </div>
        </div>
    );
}
