import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Shield, 
  Plus, 
  Phone, 
  Mail, 
  User, 
  Edit, 
  Trash2,
  Star,
  AlertTriangle
} from "lucide-react";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function EmergencyContactsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    isPrimary: false
  });

  const [contacts, setContacts] = useState([
    {
      id: "1",
      name: "Ayşe Çelik",
      phone: "+90 555 123 45 67",
      email: "ayse.celik@example.com",
      relationship: "Eş",
      isPrimary: true,
      lastContact: "2 saat önce"
    },
    {
      id: "2",
      name: "Mehmet Çelik",
      phone: "+90 555 987 65 43",
      email: "mehmet.celik@example.com",
      relationship: "Kardeş",
      isPrimary: false,
      lastContact: "1 gün önce"
    },
    {
      id: "3",
      name: "Dr. Ali Yılmaz",
      phone: "+90 555 456 78 90",
      email: "ali.yilmaz@hospital.com",
      relationship: "Doktor",
      isPrimary: false,
      lastContact: "1 hafta önce"
    }
  ]);

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      const contact = {
        id: Date.now().toString(),
        ...newContact,
        lastContact: "Henüz iletişim kurulmadı"
      };
      setContacts(prev => [...prev, contact]);
      setNewContact({ name: "", phone: "", email: "", relationship: "", isPrimary: false });
      setIsAddingContact(false);
    }
  };

  const handleEditContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      setNewContact({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        isPrimary: contact.isPrimary
      });
      setEditingContact(id);
    }
  };

  const handleUpdateContact = () => {
    if (editingContact) {
      setContacts(prev => prev.map(contact => 
        contact.id === editingContact 
          ? { ...contact, ...newContact }
          : contact
      ));
      setEditingContact(null);
      setNewContact({ name: "", phone: "", email: "", relationship: "", isPrimary: false });
    }
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    window.open(`sms:${phone}`);
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Acil Durum Kişileri</h1>
                  <p className="text-xs text-gray-500">Acil durum iletişim listesi</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsAddingContact(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Kişi Ekle
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Emergency Alert */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Acil Durum Uyarısı</h3>
                <p className="text-sm text-red-600">
                  Acil durumlarda bu kişilere otomatik olarak bildirim gönderilir. 
                  En az bir kişi eklemeniz önerilir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Contact Form */}
        {(isAddingContact || editingContact) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingContact ? "Kişiyi Düzenle" : "Yeni Kişi Ekle"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ad soyad girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ornek@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Yakınlık</Label>
                  <Input
                    id="relationship"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="Eş, Kardeş, Arkadaş..."
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={newContact.isPrimary}
                  onChange={(e) => setNewContact(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isPrimary" className="text-sm">
                  Birincil acil durum kişisi
                </Label>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingContact ? "Güncelle" : "Ekle"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsAddingContact(false);
                    setEditingContact(null);
                    setNewContact({ name: "", phone: "", email: "", relationship: "", isPrimary: false });
                  }}
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className={contact.isPrimary ? "border-blue-200 bg-blue-50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        {contact.isPrimary && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Star className="w-3 h-3 mr-1" />
                            Birincil
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{contact.relationship}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Son iletişim: {contact.lastContact}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(contact.phone)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessage(contact.phone)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditContact(contact.id)}
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {contacts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz acil durum kişisi yok</h3>
              <p className="text-gray-600 mb-4">
                Acil durumlarda size ulaşabilecek kişileri ekleyin.
              </p>
              <Button 
                onClick={() => setIsAddingContact(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                İlk Kişiyi Ekle
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
