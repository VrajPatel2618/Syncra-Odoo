"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const MapModal = dynamic(() => import("@/components/deliveries/MapModal"), { ssr: false });

const cityCoordinates: Record<string, {lat: number, lng: number}> = {
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Rajkot": { lat: 22.3039, lng: 70.8022 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
};

export default function DeliveriesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["deliveries"], queryFn: () => systemApi.deliveries().then(r => r.data.data) });
  const [selectedMap, setSelectedMap] = useState<{currentLat?: number, currentLng?: number, destLat: number, destLng: number, title: string, destCity: string} | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING": return "primary";
      case "DELAYED": return "destructive";
      case "DELIVERED": return "success";
      default: return "info";
    }
  };

  const openMap = (d: any) => {
    const city = d.salesOrder?.customer?.city;
    const dest = city && cityCoordinates[city] ? cityCoordinates[city] : { lat: 20.5937, lng: 78.9629 };
    setSelectedMap({
      currentLat: d.currentLat || undefined,
      currentLng: d.currentLng || undefined,
      destLat: dest.lat,
      destLng: dest.lng,
      title: d.deliveryNumber,
      destCity: city || "Unknown Location"
    });
  };

  return (
    <div>
      <PageHeader title="Delivery Management" description="Logistics dashboard and shipment timelines" icon={Truck} />
      <DataTable loading={isLoading} data={data||[]} columns={[
        { key: "deliveryNumber", header: "Delivery #" }, 
        { key: "salesOrder", header: "Order", render: (d: any) => d.salesOrder?.orderNumber },
        { key: "status", header: "Status", render: (d: any) => <Badge variant={getStatusColor(String(d.status)) as any}>{String(d.status)}</Badge> }, 
        { key: "trackingNumber", header: "Tracking" },
        { key: "location", header: "Location", render: (d: any) => (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openMap(d)}>
              <MapPin className="w-3 h-3 mr-1" /> View Map
            </Button>
        )}
      ]} />
      
      {selectedMap && (
        <MapModal 
          currentLat={selectedMap.currentLat} 
          currentLng={selectedMap.currentLng} 
          destLat={selectedMap.destLat}
          destLng={selectedMap.destLng}
          destCity={selectedMap.destCity}
          title={selectedMap.title} 
          onClose={() => setSelectedMap(null)} 
        />
      )}
    </div>
  );
}
