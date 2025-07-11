import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Cache for JWT tokens to avoid excessive auth calls
const tokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

async function getAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  try {
    // The API uses API Key ID and API Key for authentication
    const apiID = process.env.AUTODEALERDATA_API_KEY_ID;
    const apiKey = process.env.AUTODEALERDATA_API_KEY;
    
    if (!apiID || !apiKey) {
      throw new Error('Auto Dealer Data API credentials not configured');
    }

    // The API expects query parameters for authentication
    const authUrl = new URL(`${process.env.AUTODEALERDATA_API_URL}/getToken`);
    authUrl.searchParams.append('apiID', apiID);
    authUrl.searchParams.append('apiKey', apiKey);

    
    const response = await fetch(authUrl.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to authenticate with Auto Dealer Data API: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns the token in the 'token' field
    tokenCache.token = data.token;
    tokenCache.expiresAt = data.expires ? data.expires * 1000 : Date.now() + (55 * 60 * 1000);
    
    if (!tokenCache.token) {
      throw new Error('No token received from Auto Dealer Data API');
    }
    
    
    return tokenCache.token;
  } catch (error) {
    throw error;
  }
}

export async function POST(req: NextRequest) {
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { vin } = body;

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 });
    }

    
    // Get JWT token
    const jwt = await getAuthToken();

    // Call VIN decode API
    const apiUrl = process.env.AUTODEALERDATA_API_URL;
    const vinDecodeUrl = `${apiUrl}/vinDecode?` + new URLSearchParams({
      jwt: jwt,
      vin: vin,
      includeRecall: 'true', // Include recall information
      passEmpty: 'false', // Don't include empty fields
    });

    
    const response = await fetch(vinDecodeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to decode VIN', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Process and structure the response - data is nested in 'data' object
    const vehicleData = data.data || {};
    
    const result = {
      vehicleInfo: {
        // Basic Vehicle Information
        make: vehicleData.Make,
        model: vehicleData.Model,
        year: vehicleData.ModelYear,
        trim: vehicleData.Trim,
        vin: vehicleData.VIN,
        vehicleType: vehicleData.VehicleType,
        bodyClass: vehicleData.BodyClass,
        
        // Engine & Performance
        displacementL: vehicleData.DisplacementL,
        displacementCC: vehicleData.DisplacementCC,
        displacementCI: vehicleData.DisplacementCI,
        fuelType: vehicleData.FuelTypePrimary,
        transmission: vehicleData.TransmissionStyle,
        drivetrain: vehicleData.DriveType,
        valveTrainDesign: vehicleData.ValveTrainDesign,
        
        // Dimensions & Capacity
        doors: vehicleData.Doors,
        seats: vehicleData.Seats,
        seatRows: vehicleData.SeatRows,
        wheels: vehicleData.Wheels,
        wheelSizeFront: vehicleData.WheelSizeFront,
        wheelSizeRear: vehicleData.WheelSizeRear,
        wheelBaseShort: vehicleData.WheelBaseShort,
        gvwr: vehicleData.GVWR,
        axles: vehicleData.Axles,
        
        // Manufacturing Information
        manufacturer: vehicleData.Manufacturer,
        manufacturerId: vehicleData.ManufacturerId,
        makeId: vehicleData.MakeID,
        modelId: vehicleData.ModelID,
        plantCity: vehicleData.PlantCity,
        plantState: vehicleData.PlantState,
        plantCountry: vehicleData.PlantCountry,
        plantCompanyName: vehicleData.PlantCompanyName,
        vehicleDescriptor: vehicleData.VehicleDescriptor,
        basePrice: vehicleData.BasePrice,
        
        // Safety Features
        abs: vehicleData.ABS,
        esc: vehicleData.ESC,
        tpms: vehicleData.TPMS,
        tractionControl: vehicleData.TractionControl,
        edr: vehicleData.EDR,
        
        // Driver Assistance Features
        adaptiveCruiseControl: vehicleData.AdaptiveCruiseControl,
        blindSpotMon: vehicleData.BlindSpotMon,
        forwardCollisionWarning: vehicleData.ForwardCollisionWarning,
        laneDepartureWarning: vehicleData.LaneDepartureWarning,
        laneKeepSystem: vehicleData.LaneKeepSystem,
        rearCrossTrafficAlert: vehicleData.RearCrossTrafficAlert,
        parkAssist: vehicleData.ParkAssist,
        rearVisibilitySystem: vehicleData.RearVisibilitySystem,
        pedestrianAutomaticEmergencyBraking: vehicleData.PedestrianAutomaticEmergencyBraking,
        dynamicBrakeSupport: vehicleData.DynamicBrakeSupport,
        cib: vehicleData.CIB,
        
        // Lighting & Electrical
        daytimeRunningLight: vehicleData.DaytimeRunningLight,
        adaptiveDrivingBeam: vehicleData.AdaptiveDrivingBeam,
        lowerBeamHeadlampLightSource: vehicleData.LowerBeamHeadlampLightSource,
        semiautomaticHeadlampBeamSwitching: vehicleData.SemiautomaticHeadlampBeamSwitching,
        keylessIgnition: vehicleData.KeylessIgnition,
        automaticPedestrianAlertingSound: vehicleData.AutomaticPedestrianAlertingSound,
        
        // Interior & Safety Equipment
        airBagLocFront: vehicleData.AirBagLocFront,
        airBagLocSide: vehicleData.AirBagLocSide,
        airBagLocCurtain: vehicleData.AirBagLocCurtain,
        airBagLocKnee: vehicleData.AirBagLocKnee,
        seatBeltsAll: vehicleData.SeatBeltsAll,
        otherRestraintSystemInfo: vehicleData.OtherRestraintSystemInfo,
        steeringLocation: vehicleData.SteeringLocation,
        autoReverseSystem: vehicleData.AutoReverseSystem,
        
        // Network & Communication
        canAACN: vehicleData.CAN_AACN,
      },
      recalls: vehicleData.RecallInfo || [],
      apiMetadata: {
        brandName: data.brandName,
        modelName: data.modelName,
        regionName: data.regionName,
        condition: data.condition,
        msg: data.msg,
        cacheTimeLimit: data.cacheTimeLimit,
      },
      decodedAt: new Date().toISOString(),
    };


    return NextResponse.json(result);
  } catch (error) {
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to decode VIN',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}