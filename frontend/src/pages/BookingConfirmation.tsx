import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, MapPin, Phone, Mail, Clock, ArrowLeft } from "lucide-react";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Extract booking details from URL parameters
  const guestName = searchParams.get('name') || '';
  const guestEmail = searchParams.get('email') || '';
  const roomType = searchParams.get('room') || '';
  const nights = searchParams.get('nights') || '';
  const guests = searchParams.get('guests') || '';
  const price = searchParams.get('price') || '';
  const checkIn = searchParams.get('checkin') || '';
  const checkOut = searchParams.get('checkout') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Hotel
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-luxury bg-clip-text text-transparent">
                The Grand Luxury Hotel
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Confirmation Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for choosing The Grand Luxury Hotel. Your reservation has been successfully processed.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Guest Information */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Guest Name</label>
                  <p className="text-lg font-semibold">{guestName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p className="text-lg">{guestEmail}</p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Room Type</label>
                  <p className="text-lg font-semibold">{roomType}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nights</label>
                    <p className="text-lg">{nights}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guests</label>
                    <p className="text-lg">{guests}</p>
                  </div>
                </div>
                {checkIn && checkOut && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Check-in</label>
                      <p className="text-lg">{checkIn}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Check-out</label>
                      <p className="text-lg">{checkOut}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Total Amount</span>
                  <span className="text-accent">{price}</span>
                </div>
              </CardContent>
            </Card>

            {/* Check-in Information */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check-in Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Check-in Time:</span>
                  <span className="ml-2">3:00 PM</span>
                </div>
                <div>
                  <span className="font-semibold">Check-out Time:</span>
                  <span className="ml-2">11:00 AM</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Please ensure you arrive after 3:00 PM for check-in. Early check-in may be available upon request.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Hotel Information */}
          <Card className="shadow-elegant mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Hotel Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-muted-foreground">
                  123 Luxury Boulevard<br />
                  Downtown District<br />
                  Metropolitan City, MC 12345
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>reservations@grandluxuryhotel.com</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  For any questions or special requests, please don't hesitate to contact us.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button
              variant="luxury"
              size="lg"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              Return to Homepage
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              Print Confirmation
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingConfirmation;