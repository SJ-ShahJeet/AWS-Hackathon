import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LiveKitWidget from "@/components/ai_avatar/LiveKitWidget";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Dumbbell,
  Crown,
  Calendar,
  Users,
  Star,
  ArrowRight,
  ChefHat,
  Coffee,
  MessageCircle
} from "lucide-react";

// Import images
import heroImage from "@/assets/hero-hotel.jpg";
import suiteImage from "@/assets/suite-room.jpg";
import diningImage from "@/assets/dining-restaurant.jpg";
import meetingImage from "@/assets/meeting-room.jpg";
import spaImage from "@/assets/spa-amenities.jpg";
import loungeImage from "@/assets/lounge-area.jpg";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              The Grand Luxe
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {[
                { id: "home", label: "Home" },
                { id: "rooms", label: "Rooms & Suites" },
                { id: "amenities", label: "Amenities" },
                { id: "dining", label: "Dining" },
                { id: "events", label: "Meetings & Events" },
                { id: "contact", label: "Contact" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    activeSection === item.id ? "text-accent" : "text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button variant="luxury" size="sm" onClick={() => navigate('/booking')}>Book Now</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className={`relative z-10 text-center text-white px-6 max-w-4xl mx-auto ${
          isVisible ? "animate-fade-in" : "opacity-0"
        }`}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Experience 
            <span className="block bg-gradient-gold bg-clip-text text-transparent">
              Luxury Redefined
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Where elegance meets comfort in the heart of the city
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => scrollToSection("rooms")}>
              Explore Rooms <ArrowRight className="ml-2" />
            </Button>
            <Button variant="luxury" size="xl">
              Book Your Stay
            </Button>
          </div>
        </div>
      </section>

      {/* Rooms & Suites */}
      <section id="rooms" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Rooms & Suites</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our collection of meticulously designed accommodations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Executive Suite",
                price: "$450",
                image: suiteImage,
                features: ["King Bed", "City View", "Living Area", "Premium Amenities"]
              },
              {
                title: "Deluxe Room",
                price: "$280",
                image: loungeImage,
                features: ["Queen Bed", "Modern Design", "Work Desk", "Marble Bath"]
              },
              {
                title: "Presidential Suite",
                price: "$800",
                image: suiteImage,
                features: ["Master Suite", "Panoramic View", "Butler Service", "Private Terrace"]
              }
            ].map((room, index) => (
              <Card key={index} className="overflow-hidden shadow-luxury hover:shadow-hover transition-all duration-300 animate-scale-in group">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={room.image} 
                    alt={room.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-accent text-primary px-3 py-1 rounded-full text-sm font-semibold">
                    {room.price}/night
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-3">{room.title}</h3>
                  <ul className="space-y-2 mb-6">
                    {room.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-muted-foreground">
                        <Star className="h-4 w-4 text-accent mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="elegant" className="w-full" onClick={() => navigate('/booking')}>
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">World-Class Amenities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Indulge in our premium facilities designed for your comfort and convenience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              {[
                { icon: Waves, title: "Spa & Wellness", desc: "Rejuvenate in our award-winning spa with premium treatments", link: "/spa-wellness" },
                { icon: Dumbbell, title: "Fitness Center", desc: "State-of-the-art equipment available 24/7", link: "/fitness-center" },
                { icon: Wifi, title: "High-Speed WiFi", desc: "Complimentary internet throughout the property", link: null },
                { icon: Car, title: "Valet Parking", desc: "Secure parking with professional valet service", link: "/valet-parking" }
              ].map((amenity, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-4 ${amenity.link ? 'cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors' : 'p-4'}`}
                  onClick={() => amenity.link && navigate(amenity.link)}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center">
                    <amenity.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{amenity.title}</h3>
                    <p className="text-muted-foreground">{amenity.desc}</p>
                    {amenity.link && (
                      <p className="text-sm text-primary mt-2 hover:underline">Learn more →</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="animate-scale-in">
              <img 
                src={spaImage} 
                alt="Spa Amenities"
                className="w-full h-96 object-cover rounded-lg shadow-luxury"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dining */}
      <section id="dining" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Exquisite Dining</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Savor culinary excellence at our award-winning restaurants
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card className="overflow-hidden shadow-luxury animate-scale-in">
              <div className="relative h-64">
                <img 
                  src={diningImage} 
                  alt="Fine Dining Restaurant"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <ChefHat className="h-5 w-5 text-accent mr-2" />
                  <h3 className="text-2xl font-bold">Le Jardin</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Award-winning fine dining with innovative cuisine and impeccable service
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Open: 6 PM - 11 PM</span>
                  <Button variant="luxury" size="sm">Reserve Table</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-luxury animate-scale-in">
              <div className="relative h-64">
                <img 
                  src={loungeImage} 
                  alt="Café & Lounge"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <Coffee className="h-5 w-5 text-accent mr-2" />
                  <h3 className="text-2xl font-bold">Sky Lounge</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Casual dining with panoramic city views and artisan coffee
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Open: 7 AM - 10 PM</span>
                  <Button variant="elegant" size="sm">View Menu</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Meetings & Events */}
      <section id="events" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Meetings & Events</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Host memorable events in our sophisticated venues
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Grand Ballroom",
                capacity: "300 guests",
                image: meetingImage,
                features: ["Crystal chandeliers", "Premium AV equipment", "Dedicated event planning"]
              },
              {
                title: "Executive Boardroom",
                capacity: "20 guests",
                image: meetingImage,
                features: ["Private entrance", "High-tech presentation", "Catering available"]
              },
              {
                title: "Garden Terrace",
                capacity: "150 guests",
                image: loungeImage,
                features: ["Outdoor setting", "City views", "Weather protection"]
              }
            ].map((venue, index) => (
              <Card key={index} className="overflow-hidden shadow-luxury hover:shadow-hover transition-all duration-300 animate-scale-in">
                <div className="relative h-48">
                  <img 
                    src={venue.image} 
                    alt={venue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{venue.title}</h3>
                    <div className="flex items-center text-accent">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">{venue.capacity}</span>
                    </div>
                  </div>
                  <ul className="space-y-1 mb-6 text-sm text-muted-foreground">
                    {venue.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                  <Button variant="elegant" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Check Availability
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to make your stay exceptional
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 animate-slide-in-left">
              <div>
                <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">123 Luxury Avenue, Downtown District</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">reservations@grandluxe.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="shadow-luxury animate-scale-in">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="First Name" />
                    <Input placeholder="Last Name" />
                  </div>
                  <Input placeholder="Email Address" type="email" />
                  <Input placeholder="Phone Number" type="tel" />
                  <Textarea placeholder="How can we assist you?" rows={4} />
                  <Button variant="luxury" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-gold bg-clip-text text-transparent">
                The Grand Luxe
              </h3>
              <p className="text-primary-foreground/80">
                Experience luxury redefined in the heart of the city.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#rooms" className="hover:text-accent transition-colors">Rooms & Suites</a></li>
                <li><a href="#amenities" className="hover:text-accent transition-colors">Amenities</a></li>
                <li><a href="#dining" className="hover:text-accent transition-colors">Dining</a></li>
                <li><a href="#events" className="hover:text-accent transition-colors">Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Concierge</li>
                <li>Room Service</li>
                <li>Spa & Wellness</li>
                <li>Business Center</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-primary-foreground/80">
                <p>123 Luxury Avenue</p>
                <p>+1 (555) 123-4567</p>
                <p>info@grandluxe.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
            <p>&copy; 2024 The Grand Luxe Hotel. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating AI Concierge Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          variant="luxury" 
          size="lg"
          className="rounded-full shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 flex items-center gap-2 px-6 py-3"
          onClick={() => setShowSupport(true)}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Talk to AI Concierge</span>
        </Button>
      </div>
      {/* LiveKit Widget */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto">
            <LiveKitWidget setShowSupport={setShowSupport} />
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;