import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Clock, 
  Dumbbell, 
  Activity, 
  Users,
  Heart,
  Phone,
  Calendar,
  Target,
  Zap
} from "lucide-react";
import fitnessCardioArea from "@/assets/fitness-cardio-area.jpg";
import fitnessStrengthArea from "@/assets/fitness-strength-area.jpg";
import fitnessGroupClass from "@/assets/fitness-group-class.jpg";
import fitnessFunctionalTraining from "@/assets/fitness-functional-training.jpg";

const FitnessCenter = () => {
  const navigate = useNavigate();

  const equipment = [
    {
      category: "Cardio Equipment",
      icon: Heart,
      image: fitnessCardioArea,
      items: [
        "12 Treadmills with personal TVs",
        "8 Elliptical machines", 
        "6 Stationary bikes",
        "4 Rowing machines",
        "2 StairMasters"
      ]
    },
    {
      category: "Strength Training",
      icon: Dumbbell,
      image: fitnessStrengthArea,
      items: [
        "Complete free weight section (5-100 lbs)",
        "Olympic lifting platform",
        "Cable machine systems",
        "Smith machine",
        "Leg press machines"
      ]
    },
    {
      category: "Functional Training", 
      icon: Target,
      image: fitnessFunctionalTraining,
      items: [
        "TRX suspension trainers",
        "Battle ropes",
        "Medicine balls",
        "Kettlebells (10-80 lbs)",
        "Resistance bands"
      ]
    },
    {
      category: "Specialized Machines",
      icon: Zap,
      image: fitnessStrengthArea,
      items: [
        "Multi-station gym equipment",
        "Assisted pull-up machines",
        "Cable crossover machines",
        "Plate-loaded machines",
        "Pneumatic resistance equipment"
      ]
    }
  ];

  const classes = [
    {
      name: "High-Intensity Interval Training",
      time: "6:00 AM, 12:00 PM, 6:00 PM",
      duration: "45 mins",
      level: "All Levels"
    },
    {
      name: "Yoga & Mindfulness",
      time: "7:00 AM, 5:30 PM",
      duration: "60 mins", 
      level: "Beginner to Advanced"
    },
    {
      name: "Strength & Conditioning",
      time: "8:00 AM, 1:00 PM",
      duration: "50 mins",
      level: "Intermediate"
    },
    {
      name: "Spin Class",
      time: "6:30 AM, 12:30 PM, 7:00 PM",
      duration: "45 mins",
      level: "All Levels"
    },
    {
      name: "Pilates",
      time: "9:00 AM, 4:00 PM",
      duration: "55 mins",
      level: "All Levels"
    },
    {
      name: "Aqua Fitness",
      time: "10:00 AM, 2:00 PM",
      duration: "45 mins",
      level: "All Levels"
    }
  ];

  const amenities = [
    {
      icon: Users,
      name: "Personal Training",
      description: "Certified trainers available for one-on-one sessions"
    },
    {
      icon: Activity,
      name: "Group Classes",
      description: "Daily fitness classes for all skill levels"
    },
    {
      icon: Heart,
      name: "Wellness Assessment",
      description: "Complimentary fitness evaluations and goal setting"
    },
    {
      icon: Zap,
      name: "Recovery Zone",
      description: "Massage chairs and stretching area"
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
              Call Fitness Center
            </Button>
            <Button className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Training
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={fitnessCardioArea} 
            alt="Modern fitness center" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Fitness & Wellness
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              State-of-the-Art Fitness Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform your fitness journey with our premium equipment, expert trainers, 
              and comprehensive wellness programs designed to help you achieve your goals.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                24/7 Access for Guests
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Professional Equipment
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Certified Trainers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Premium Equipment</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our fitness center features the latest commercial-grade equipment 
              from leading manufacturers, ensuring a superior workout experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {equipment.map((section, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300 overflow-hidden">
                <div className="relative h-48">
                  <img 
                    src={section.image} 
                    alt={section.category} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center mb-2">
                      <section.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{section.category}</h3>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fitness Classes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our energizing group fitness classes led by certified instructors. 
              All skill levels welcome, with modifications available for every participant.
            </p>
          </div>

          {/* Featured Class Image */}
          <div className="mb-12">
            <Card className="overflow-hidden">
              <div className="relative h-64">
                <img 
                  src={fitnessGroupClass} 
                  alt="Group fitness class in session" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container">
                    <div className="max-w-lg">
                      <h3 className="text-2xl font-bold text-white mb-2">Join Our Group Classes</h3>
                      <p className="text-white/90">
                        Experience the energy and motivation of working out with others in our spacious studio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((fitnessClass, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{fitnessClass.name}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {fitnessClass.time}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration: {fitnessClass.duration}</span>
                      <Badge variant="secondary" className="text-xs">
                        {fitnessClass.level}
                      </Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Amenities */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Beyond equipment and classes, we offer comprehensive fitness services 
              to support your complete wellness journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenities.map((amenity, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                    <amenity.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{amenity.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{amenity.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hours & Info */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Facility Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Fitness Center</span>
                  <span className="font-medium">24/7 Access</span>
                </div>
                <div className="flex justify-between">
                  <span>Group Classes</span>
                  <span className="font-medium">6:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Personal Training</span>
                  <span className="font-medium">5:00 AM - 11:00 PM</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Hotel guests receive complimentary access with valid room key
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fitness Center Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li>• Proper athletic attire and closed-toe shoes required</li>
                  <li>• Towels and water bottles provided complimentary</li>
                  <li>• Personal training sessions require advance booking</li>
                  <li>• Children under 16 must be accompanied by an adult</li>
                  <li>• Please wipe down equipment after use</li>
                  <li>• Locker rooms include shower facilities and amenities</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FitnessCenter;