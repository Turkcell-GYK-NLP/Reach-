import React, { useState, useEffect } from "react";
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
  AlertTriangle,
  Loader2
} from "lucide-react";
import HamburgerMenu from "@/components/HamburgerMenu";
import { api } from "@/lib/api";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  lastContact?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmergencyContactsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    isPrimary: false
  });

  // Get user ID from localStorage auth object
  const [userId, setUserId] = useState<string | null>(null);

  // Load user ID from localStorage and emergency contacts on component mount
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null");
      if (auth?.user?.id) {
        setUserId(auth.user.id);
      } else {
        // If no auth data, redirect to auth page
        window.location.href = "/auth";
        return;
      }
    } catch (error) {
      console.error("Auth error:", error);
      window.location.href = "/auth";
      return;
    }
  }, []);

  // Load emergency contacts when userId is available
  useEffect(() => {
    if (userId) {
      loadEmergencyContacts();
    }
  }, [userId]);

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true);
      console.log("Loading emergency contacts for userId:", userId);
      const data = await api.getEmergencyContacts(userId!);
      console.log("Emergency contacts loaded:", data);
      setContacts(data);
    } catch (error) {
      console.error("Failed to load emergency contacts:", error);
      alert("Acil durum kişileri yüklenirken hata oluştu: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      alert("Lütfen tüm gerekli alanları doldurun (Ad, Telefon, İlişki)");
      return;
    }

    try {
      setSaving(true);
      const contactData = {
        userId: userId!,
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email || undefined,
        relationship: newContact.relationship,
        isPrimary: newContact.isPrimary
      };

      const newContactData = await api.createEmergencyContact(contactData);
      setContacts(prev => [...prev, newContactData]);
      setNewContact({ name: "", phone: "", email: "", relationship: "", isPrimary: false });
      setIsAddingContact(false);
    } catch (error) {
      console.error("Failed to create emergency contact:", error);
      alert("Acil durum kişisi eklenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleEditContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      setNewContact({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || "",
        relationship: contact.relationship,
        isPrimary: contact.isPrimary
      });
      setEditingContact(id);
      setIsAddingContact(true);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      setSaving(true);
      const updates = {
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email || undefined,
        relationship: newContact.relationship,
        isPrimary: newContact.isPrimary
      };

      const updatedContact = await api.updateEmergencyContact(editingContact, updates);
      setContacts(prev => prev.map(contact => 
        contact.id === editingContact ? updatedContact : contact
      ));
      setEditingContact(null);
      setNewContact({ name: "", phone: "", email: "", relationship: "", isPrimary: false });
      setIsAddingContact(false);
    } catch (error) {
      console.error("Failed to update emergency contact:", error);
      alert("Acil durum kişisi güncellenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Bu acil durum kişisini silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await api.deleteEmergencyContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
    } catch (error) {
      console.error("Failed to delete emergency contact:", error);
      alert("Acil durum kişisi silinirken hata oluştu");
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const updatedContact = await api.setPrimaryEmergencyContact(id, userId!);
      setContacts(prev => prev.map(contact => ({
        ...contact,
        isPrimary: contact.id === id
      })));
    } catch (error) {
      console.error("Failed to set primary contact:", error);
      alert("Birincil acil durum kişisi ayarlanırken hata oluştu");
    }
  };

  const handleCancel = () => {
    setIsAddingContact(false);
    setEditingContact(null);
    setNewContact({ name: "", phone: "", email: "", relationship: "", isPrimary: false });
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    window.location.href = path;
  };

  if (!userId || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{!userId ? "Kullanıcı bilgileri yükleniyor..." : "Acil durum kişileri yükleniyor..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 mr-2"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Acil Durum Kişileri</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Contact Button */}
        <div className="mb-6">
          <Button
            onClick={() => setIsAddingContact(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            <Plus className="w-4 h-4 mr-2" />
            Kişi Ekle
          </Button>
        </div>

        {/* Add/Edit Contact Form */}
        {isAddingContact && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingContact ? "Acil Durum Kişisini Düzenle" : "Yeni Acil Durum Kişisi Ekle"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ad Soyad *</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ad Soyad"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+90 555 123 45 67"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ornek@email.com"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">İlişki *</Label>
                  <Input
                    id="relationship"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="Eş, Kardeş, Doktor, vs."
                    disabled={saving}
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
                  disabled={saving}
                />
                <Label htmlFor="isPrimary" className="text-sm">
                  Birincil acil durum kişisi
                </Label>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingContact ? "Güncelleniyor..." : "Ekleniyor..."}
                    </>
                  ) : (
                    editingContact ? "Güncelle" : "Ekle"
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz acil durum kişisi eklenmemiş</h3>
                <p className="text-gray-500 mb-4">Acil durumlarda iletişim kurabileceğiniz kişileri ekleyin</p>
                <Button
                  onClick={() => setIsAddingContact(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  İlk Kişiyi Ekle
                </Button>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{contact.name}</h3>
                        {contact.isPrimary && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Birincil
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{contact.relationship}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!contact.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(contact.id)}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Birincil Yap
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContact(contact.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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