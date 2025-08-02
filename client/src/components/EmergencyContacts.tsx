import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Shield, Activity } from "lucide-react";

export default function EmergencyContacts() {
  const contacts = [
    {
      icon: Phone,
      title: "112 Acil Çağrı",
      description: "Acil Durum Merkezi",
      number: "112",
      color: "bg-red-50 hover:bg-red-100",
      iconBg: "bg-emergency",
    },
    {
      icon: Shield,
      title: "110 İtfaiye",
      description: "Yangın ve Kurtarma",
      number: "110",
      color: "bg-blue-50 hover:bg-blue-100",
      iconBg: "bg-trust",
    },
    {
      icon: Activity,
      title: "155 Polis",
      description: "Emniyet Güçleri",
      number: "155",
      color: "bg-green-50 hover:bg-green-100",
      iconBg: "bg-success",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acil İletişim</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contacts.map((contact, index) => (
            <a
              key={index}
              href={`tel:${contact.number}`}
              className={`flex items-center space-x-3 p-3 ${contact.color} rounded-lg transition-colors block`}
            >
              <div className={`w-10 h-10 ${contact.iconBg} text-white rounded-full flex items-center justify-center`}>
                <contact.icon size={16} />
              </div>
              <div>
                <p className="font-medium text-dark">{contact.title}</p>
                <p className="text-xs text-gray-500">{contact.description}</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
