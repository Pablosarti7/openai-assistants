const businessInfoFunctions = [
  {
    type: "function",
    function: {
      name: "get_services",
      description: "Get the list of services offered by the web development agency",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_pricing",
      description: "Get pricing information for the web development agency's services",
      parameters: {
        type: "object",
        properties: {
          service: {
            type: "string",
            description: "The specific service to get pricing for",
          },
        },
        required: ["service"],
        additionalProperties: false,
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_business_hours",
      description: "Get the business hours for the web development agency",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_location",
      description: "Get the location of the web development agency",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    }
  },
];


// Function to get services
function get_services() {
  return {
      services: [
          "Web Design",
          "Web Development",
          "E-commerce Solutions",
          "Mobile App Development",
          "SEO Optimization"
      ]
  };
}

// Function to get pricing
function get_pricing(service) {
  const pricingInfo = {
      "Web Design": "$1,000 - $5,000",
      "Web Development": "$5,000 - $20,000",
      "E-commerce Solutions": "$10,000 - $50,000",
      "Mobile App Development": "$15,000 - $100,000",
      "SEO Optimization": "$500 - $2,000 per month"
  };

  return {
      service: service,
      pricing: pricingInfo[service] || "Pricing not available for this service"
  };
}

// Function to get business hours
function get_business_hours() {
  return {
      hours: {
          Monday: "9:00 AM - 5:00 PM",
          Tuesday: "9:00 AM - 5:00 PM",
          Wednesday: "9:00 AM - 5:00 PM",
          Thursday: "9:00 AM - 5:00 PM",
          Friday: "9:00 AM - 5:00 PM",
          Saturday: "Closed",
          Sunday: "Closed"
      }
  };
}

// Function to get location
function get_location() {
  return {
      address: "123 Web Dev Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA"
  };
}


export { businessInfoFunctions, get_services, get_pricing, get_business_hours, get_location };
