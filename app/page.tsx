"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const CapabilityMap = () => {
  const [capabilities] = useState({
    "Patient Acquisition": {
      id: "1",
      desc: "Activities focused on attracting new patients to the dental practice.",
      score: 82,
      children: {
        "Marketing and Outreach": {
          id: "1.1",
          desc: "Strategies and tactics to promote the practice and reach potential patients.",
          children: {
            "Digital Marketing": {
              id: "1.1.1",
              desc: "Online marketing efforts via digital channels.",
              score: 75,
              children: {
                "Social Media Campaigns": {
                  id: "1.1.1.1",
                  desc: "Engaging with potential patients through social media platforms.",
                  score: 72,
                },
                "Email Marketing": {
                  id: "1.1.1.2",
                  desc: "Sending promotional and informative emails to subscribers and patients.",
                  score: 77,
                },
              },
            },
            "Traditional Marketing": {
              id: "1.1.2",
              desc: "Offline marketing efforts through traditional media channels.",
              score: 82,
              children: {
                "Print Ads": {
                  id: "1.1.2.1",
                  desc: "Advertising in newspapers, magazines, and brochures.",
                  score: 68,
                },
                "Direct Mail": {
                  id: "1.1.2.2",
                  desc: "Sending physical promotional materials to potential patients.",
                  score: 70,
                },
              },
            },
          },
        },
      },
    },
    "Patient Onboarding": {
      id: "2",
      desc: "Processes involved in welcoming and registering new patients.",
      score: 85,
      children: {
        "Appointment Scheduling": {
          id: "2.1",
          desc: "Systems and procedures for booking patient appointments.",
          children: {
            "Initial Contact Management": {
              id: "2.1.1",
              desc: "Handling inquiries and appointment requests from new patients.",
              score: 88,
              children: {
                "Phone Inquiries": {
                  id: "2.1.1.1",
                  desc: "Managing appointment requests received via telephone.",
                  score: 90,
                },
                "Online Booking Requests": {
                  id: "2.1.1.2",
                  desc: "Managing appointment requests received through online platforms.",
                  score: 86,
                },
              },
            },
            "Appointment Confirmation": {
              id: "2.1.2",
              desc: "Confirming scheduled appointments and sending reminders.",
              score: 82,
              children: {
                "Automated Reminders": {
                  id: "2.1.2.1",
                  desc: "Sending automated messages to remind patients of upcoming appointments.",
                  score: 84,
                },
                "Rescheduling Options": {
                  id: "2.1.2.2",
                  desc: "Providing options for patients to reschedule appointments if needed.",
                  score: 80,
                },
              },
            },
          },
        },
      },
    },
  });

  const [showHeatMap, setShowHeatMap] = useState(true);

  const getScoreColor = (score) => {
    if (!score && score !== 0) return "bg-gray-400";
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const renderScore = (score) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

  const renderCapabilityRow = (name, data, className = "") => (
    <div className={`flex items-center group relative ${className}`}>
      <div className="flex-1">
        <span>{name}</span>
        <span className="text-gray-500 ml-2">{data.id}</span>
      </div>
      <div className="w-16 flex justify-center">{renderScore(data.score)}</div>
      <div className="hidden group-hover:block absolute z-10 bg-black text-white p-2 rounded text-xs -top-8 left-0 w-48">
        {data.desc}
      </div>
    </div>
  );

  const renderLevel4 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-1 border-l-2 border-gray-200 ml-2">
        {renderCapabilityRow(name, data, "text-xs")}
      </div>
    ));
  };

  const renderLevel3 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-2 border rounded">
        {renderCapabilityRow(name, data, "text-sm font-medium")}
        {data.children && (
          <div className="mt-2">{renderLevel4(data.children)}</div>
        )}
      </div>
    ));
  };

  const renderLevel2 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="border rounded p-2 bg-gray-50">
        {renderCapabilityRow(name, data, "font-medium mb-2")}
        <div className="grid grid-cols-1 gap-2">
          {data.children && renderLevel3(data.children)}
        </div>
      </div>
    ));
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Dental Practice Capability Model
          </h1>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showHeatMap}
              onChange={() => setShowHeatMap((prev) => !prev)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Show Heat Map</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(capabilities).map(([domain, data]) => (
            <div key={domain} className="border rounded p-4">
              {renderCapabilityRow(domain, data, "text-lg font-bold mb-4")}
              <div className="grid grid-cols-1 gap-4">
                {data.children && renderLevel2(data.children)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  return (
    <main>
      <CapabilityMap />
    </main>
  );
}
