import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  Waves, 
  Flower2, 
  Heart,
  Phone,
  Calendar
} from "lucide-react";
import spaImage from "@/assets/spa-amenities.jpg";

const SpaWellness = () => {
  const navigate = useNavigate();

  const treatments = [
    {
      name: "Signature Relaxation Massage",
      duration: "60 mins",
      price: "$180",
      description: "Full-body therapeutic massage with aromatic oils"
    },
    {
      name: "Deep Tissue Massage", 
      duration: "90 mins",
      price: "$240",
      description: "Intensive muscle therapy for tension relief"
    },
    {
      name: "Couples Spa Package",
      duration: "120 mins", 
      price: "$450",
      description: "Side-by-side massage with champagne service"
    },
    {
      name: "Rejuvenating Facial",
      duration: "75 mins",
      price: "$160",
      description: "Customized facial treatment for all skin types"
    },
    {
      name: "Hot Stone Therapy",
      duration: "90 mins",
      price: "$220",
      description: "Heated volcanic stones for deep muscle relaxation"
    },
    {
      name: "Aromatherapy Session",
      duration: "60 mins",
      price: "$170",
      description: "Essential oil therapy for mind and body wellness"
    }
  ];

  const facilities = [
    {
      icon: Waves,
      name: "Infinity Pool",
      description: "Temperature-controlled pool with city views"
    },
    {
      icon: Sparkles,
      name: "Steam Room",
      description: "Eucalyptus-infused steam for detoxification"
    },
    {
      icon: Flower2,
      name: "Meditation Garden",
      description: "Tranquil outdoor space for mindfulness"
    },
    {
      icon: Heart,
      name: "Wellness Lounge",
      description: "Relaxation area with herbal teas"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Spa
            </Button>
            <Button className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Book Treatment
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={spaImage} 
            alt="Spa Amenities" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60" />
        </div>
        <div className="container relative">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">
              Wellness & Relaxation
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Spa & Wellness Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Escape to our world-class spa sanctuary featuring premium treatments, 
              state-of-the-art facilities, and expert therapists dedicated to your wellness journey.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Open Daily 6:00 AM - 10:00 PM
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Award-Winning Spa
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Signature Treatments</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Indulge in our carefully curated selection of therapeutic treatments 
              designed to restore, rejuvenate, and revitalize your body and mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatments.map((treatment, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{treatment.name}</CardTitle>
                    <Badge variant="secondary">{treatment.price}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {treatment.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{treatment.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Premium Facilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Immerse yourself in our luxurious amenities designed to enhance 
              your wellness experience and promote complete relaxation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((facility, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                    <facility.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{facility.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{facility.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hours & Contact */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">6:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday - Sunday</span>
                  <span className="font-medium">7:00 AM - 11:00 PM</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Last treatment bookings accepted 90 minutes before closing
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spa Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li>• Arrive 15 minutes early for your appointment</li>
                  <li>• 24-hour cancellation policy applies</li>
                  <li>• Complimentary robes and slippers provided</li>
                  <li>• Mobile phones must be silenced in spa areas</li>
                  <li>• Gratuities are welcomed but not required</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpaWellness;