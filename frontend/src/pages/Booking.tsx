import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Booking = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hotel
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Luxe Vista Hotel</h1>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Book a Room</h1>
            <p className="text-muted-foreground text-lg">
              Select your preferred dates and we'll show you available rooms
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-center">Select Your Dates</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border border-border"
                disabled={(date) => date < new Date()}
              />
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button variant="luxury" size="lg" className="px-12">
              Search Available Rooms
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;