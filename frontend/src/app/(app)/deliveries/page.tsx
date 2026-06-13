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

export default function DeliveriesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["deliveries"], queryFn: () => systemApi.deliveries().then(r => r.data.data) });
  const [selectedMap, setSelectedMap] = useState<{lat: number, lng: number, title: string} | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING": return "primary";
      case "DELAYED": return "destructive";
      case "DELIVERED": return "success";
      default: return "info";
    }
  };

  return (
    <div>
      <PageHeader title="Delivery Management" description="Logistics dashboard and shipment timelines" icon={Truck} />
      <DataTable loading={isLoading} data={data||[]} columns={[
        { key: "deliveryNumber", header: "Delivery #" }, 
        { key: "salesOrder", header: "Order", render: (d) => (d.salesOrder as {orderNumber:string})?.orderNumber },
        { key: "status", header: "Status", render: (d) => <Badge variant={getStatusColor(String(d.status)) as any}>{String(d.status)}</Badge> }, 
        { key: "trackingNumber", header: "Tracking" },
        { key: "location", header: "Location", render: (d: any) => {
          if (d.currentLat && d.currentLng && (d.status === 'ONGOING' || d.status === 'DELAYED')) {
            return (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedMap({ lat: d.currentLat, lng: d.currentLng, title: d.deliveryNumber })}>
                <MapPin className="w-3 h-3 mr-1" /> View Map
              </Button>
            );
          }
          return <span className="text-stone-500 text-xs">—</span>;
        }}
      ]} />
      
      {selectedMap && (
        <MapModal 
          lat={selectedMap.lat} 
          lng={selectedMap.lng} 
          title={selectedMap.title} 
          onClose={() => setSelectedMap(null)} 
        />
      )}
    </div>
  );
}
