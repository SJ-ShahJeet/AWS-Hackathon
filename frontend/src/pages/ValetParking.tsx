import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Clock, 
  Car, 
  Shield, 
  Key,
  Sparkles,
  Phone,
  MapPin,
  DollarSign,
  CheckCircle
} from "lucide-react";

const ValetParking = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Car,
      name: "Premium Valet Service",
      description: "Professional attendants park and retrieve your vehicle",
      price: "$35/night"
    },
    {
      icon: Sparkles,
      name: "Car Detailing",
      description: "Interior and exterior cleaning while you stay",
      price: "$85/service"
    },
    {
      icon: Key,
      name: "Concierge Car Service",
      description: "Vehicle maintenance and service coordination",
      price: "Quote on request"
    },
    {
      icon: Shield,
      name: "Secure Storage",
      description: "24/7 monitored underground parking garage",
      price: "Included"
    }
  ];

  const features = [
    "24/7 valet attendant coverage",
    "Covered parking garage",
    "Security cameras and monitoring",
    "Climate-controlled environment",
    "Electric vehicle charging stations",
    "Luxury vehicle handling expertise",
    "Quick retrieval service (under 5 minutes)",
    "Complimentary car wash for extended stays"
  ];

  const pricingPlans = [
    {
      name: "Standard Valet",
      price: "$35",
      period: "per night",
      features: [
        "Vehicle parking & retrieval",
        "Secure garage storage",
        "24/7 attendant service",
        "Basic vehicle protection"
      ]
    },
    {
      name: "Premium Plus",
      price: "$55", 
      period: "per night",
      features: [
        "All Standard features",
        "Priority retrieval",
        "Daily exterior wash",
        "Interior protection",
        "EV charging available"
      ]
    },
    {
      name: "Luxury Experience",
      price: "$85",
      period: "per night", 
      features: [
        "All Premium Plus features",
        "Complete detailing service",
        "Concierge car services",
        "Maintenance coordination",
        "White-glove treatment"
      ]
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
              Call Valet
            </Button>
            <Button className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Request Vehicle
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Premium Services
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Luxury Valet Parking
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the ultimate convenience with our professional valet services. 
              From arrival to departure, we ensure your vehicle receives the care and attention it deserves.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                24/7 Service
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Fully Insured
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Secure Garage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Valet Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive valet services go beyond simple parking, offering 
              a complete automotive care experience for our valued guests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-sm font-medium">
                    {service.price}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Valet Service</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the difference with our premium valet parking featuring 
              state-of-the-art facilities and exceptional service standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Service Packages</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the valet package that best suits your needs, from basic parking 
              to our premium luxury experience with complete vehicle care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`hover:shadow-elegant transition-all duration-300 ${index === 1 ? 'border-primary' : ''}`}>
                <CardHeader className="text-center">
                  {index === 1 && (
                    <Badge variant="default" className="mx-auto mb-2 w-fit">
                      Most Popular
                    </Badge>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1 text-2xl font-bold text-foreground">
                    <DollarSign className="h-5 w-5" />
                    {plan.price.replace('$', '')}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={index === 1 ? "default" : "outline"}
                  >
                    Select Package
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hours & Policies */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Service Hours & Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Valet Service</span>
                  <span className="font-medium">24/7 Available</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle Retrieval</span>
                  <span className="font-medium">Under 5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Car Detailing</span>
                  <span className="font-medium">8:00 AM - 6:00 PM</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Call ahead for vehicle retrieval during peak hours for fastest service
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policies & Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li>• Valid driver's license required for all guests</li>
                  <li>• $500,000 liability insurance coverage included</li>
                  <li>• Oversized vehicles accommodated with advance notice</li>
                  <li>• Complimentary valet for Presidential Suite guests</li>
                  <li>• Electric vehicle charging available (additional fees apply)</li>
                  <li>• Lost ticket replacement fee: $25</li>
                  <li>• Gratuities appreciated but not required</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ValetParking;