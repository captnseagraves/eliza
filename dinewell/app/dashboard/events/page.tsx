import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
            <p className="text-muted-foreground">
              Manage your dinner events and invitations
            </p>
          </div>
          <Link href="/dashboard/events/new">
            <Button>Create New Event</Button>
          </Link>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>
                  No upcoming events. Create your first event to get started!
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>
                  No past events found.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
