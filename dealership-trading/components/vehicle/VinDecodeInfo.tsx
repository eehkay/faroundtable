'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, Wrench } from 'lucide-react';

interface VehicleInfo {
  // Basic Vehicle Information
  make?: string;
  model?: string;
  year?: string | number;
  trim?: string;
  vin?: string;
  vehicleType?: string;
  bodyClass?: string;
  
  // Engine & Performance
  displacementL?: string | number;
  displacementCC?: string | number;
  displacementCI?: string | number;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  valveTrainDesign?: string;
  
  // Dimensions & Capacity
  doors?: string | number;
  seats?: string | number;
  seatRows?: string | number;
  wheels?: string | number;
  wheelSizeFront?: string | number;
  wheelSizeRear?: string | number;
  wheelBaseShort?: string | number;
  gvwr?: string;
  axles?: string | number;
  
  // Manufacturing Information
  manufacturer?: string;
  manufacturerId?: string | number;
  makeId?: string | number;
  modelId?: string | number;
  plantCity?: string;
  plantState?: string;
  plantCountry?: string;
  plantCompanyName?: string;
  vehicleDescriptor?: string;
  basePrice?: string | number;
  
  // Safety Features
  abs?: string;
  esc?: string;
  tpms?: string;
  tractionControl?: string;
  edr?: string;
  
  // Driver Assistance Features
  adaptiveCruiseControl?: string;
  blindSpotMon?: string;
  forwardCollisionWarning?: string;
  laneDepartureWarning?: string;
  laneKeepSystem?: string;
  rearCrossTrafficAlert?: string;
  parkAssist?: string;
  rearVisibilitySystem?: string;
  pedestrianAutomaticEmergencyBraking?: string;
  dynamicBrakeSupport?: string;
  cib?: string;
  
  // Lighting & Electrical
  daytimeRunningLight?: string;
  adaptiveDrivingBeam?: string;
  lowerBeamHeadlampLightSource?: string;
  semiautomaticHeadlampBeamSwitching?: string;
  keylessIgnition?: string;
  automaticPedestrianAlertingSound?: string;
  
  // Interior & Safety Equipment
  airBagLocFront?: string;
  airBagLocSide?: string;
  airBagLocCurtain?: string;
  airBagLocKnee?: string;
  seatBeltsAll?: string;
  otherRestraintSystemInfo?: string;
  steeringLocation?: string;
  autoReverseSystem?: string;
  
  // Network & Communication
  canAACN?: string;
}

interface Recall {
  id: number;
  parkIt: boolean;
  parkOutSide: boolean;
  overTheAirUpdate: boolean;
  manufacturer: string;
  mfrCampaignNumber: string;
  nhtsaCampaignNumber: string;
  reportReceivedDate: string;
  subject: string;
  summary: string;
  consequence: string;
  correctiveAction: string;
  potentialNumberOfUnitsAffected: number;
  notes?: string;
  associatedDocumentsCount: number;
  associatedDocuments: string;
  associatedProductsCount: number;
  associatedProducts: string;
  components: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  investigations: any[];
}

interface VinDecodeData {
  vehicleInfo: VehicleInfo;
  recalls: Recall[];
  decodedAt: string;
}

interface VinDecodeInfoProps {
  data: VinDecodeData;
  vin: string;
}

export default function VinDecodeInfo({ data, vin }: VinDecodeInfoProps) {
  const { recalls } = data;

  const hasRecalls = recalls && recalls.length > 0;
  const hasCriticalRecalls = recalls.some(recall => recall.parkIt || recall.parkOutSide);

  return (
    <div className="bg-[#141414] rounded-lg shadow-sm p-6 transition-all duration-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Safety Recalls & Warnings</h2>
        <span className="text-sm text-gray-400">VIN: {vin}</span>
      </div>

      {/* Critical Park Warnings */}
      {hasCriticalRecalls && (
        <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-bold text-red-300">⚠️ CRITICAL SAFETY WARNING</h3>
          </div>
          {recalls.filter(recall => recall.parkIt || recall.parkOutSide).map((recall, index) => (
            <div key={`critical-${recall.id}-${index}`} className="text-red-200">
              {recall.parkIt && <p className="font-semibold">🚨 PARK IMMEDIATELY - DO NOT DRIVE THIS VEHICLE</p>}
              {recall.parkOutSide && <p className="font-semibold">🔥 PARK OUTSIDE - FIRE RISK</p>}
              <p className="text-sm">{recall.subject}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recalls Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          {hasRecalls ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-red-400">Active Recalls ({recalls.length})</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-400">No Active Recalls</span>
            </>
          )}
        </h3>

        {hasRecalls ? (
          <div className="space-y-4">
            {recalls.map((recall, index) => (
              <div key={`recall-${recall.id}-${index}`} className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 space-y-4">
                {/* Header with critical warnings */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className="font-medium text-red-300 text-lg">
                        {recall.subject}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded">
                          NHTSA: {recall.nhtsaCampaignNumber}
                        </span>
                        {recall.mfrCampaignNumber && recall.mfrCampaignNumber !== 'TBD' && (
                          <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                            MFR: {recall.mfrCampaignNumber}
                          </span>
                        )}
                        {recall.overTheAirUpdate && (
                          <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                            OTA Update Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs text-gray-400 block">
                      {new Date(recall.reportReceivedDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500 block">
                      {recall.potentialNumberOfUnitsAffected.toLocaleString()} units affected
                    </span>
                  </div>
                </div>

                {/* Components affected */}
                {recall.components.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Affected Components:</p>
                    <div className="flex flex-wrap gap-2">
                      {recall.components.map((component) => (
                        <span key={component.id} className="bg-orange-900/20 text-orange-300 text-xs px-2 py-1 rounded-full">
                          {component.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {recall.summary && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Problem Description:</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{recall.summary}</p>
                  </div>
                )}

                {/* Safety consequence */}
                {recall.consequence && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-300">Safety Risk:</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{recall.consequence}</p>
                  </div>
                )}

                {/* Corrective action */}
                {recall.correctiveAction && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-300 flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      Remedy:
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed">{recall.correctiveAction}</p>
                  </div>
                )}

                {/* Additional notes */}
                {recall.notes && (
                  <div className="space-y-2 pt-2 border-t border-red-900/20">
                    <p className="text-sm font-medium text-gray-300">Additional Information:</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{recall.notes}</p>
                  </div>
                )}

                {/* Documents and products links */}
                {(recall.associatedDocumentsCount > 0 || recall.associatedProductsCount > 0) && (
                  <div className="flex gap-4 pt-2 border-t border-red-900/20">
                    {recall.associatedDocumentsCount > 0 && (
                      <a 
                        href={recall.associatedDocuments} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        View {recall.associatedDocumentsCount} Documents
                      </a>
                    )}
                    {recall.associatedProductsCount > 0 && (
                      <a 
                        href={recall.associatedProducts} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        View {recall.associatedProductsCount} Products
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-yellow-300 font-medium">Important Recall Information:</p>
                <p className="text-sm text-yellow-200">
                  Contact your dealership&apos;s service department immediately to schedule recall repairs. 
                  All recall repairs are performed free of charge. For urgent safety concerns, 
                  contact NHTSA at 1-888-327-4236.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-300">
              No safety recalls found for this vehicle. This vehicle appears to be free of manufacturer recalls.
            </p>
          </div>
        )}
      </div>

      {/* Data Source Disclaimer */}
      <div className="flex items-start gap-2 pt-4 border-t border-[#2a2a2a]">
        <Info className="h-4 w-4 text-gray-400 mt-0.5" />
        <p className="text-xs text-gray-400">
          VIN decode and recall data sourced from manufacturer records. Data current as of {new Date(data.decodedAt).toLocaleDateString()}.
          Always verify recall status with the manufacturer or NHTSA.
        </p>
      </div>
    </div>
  );
}