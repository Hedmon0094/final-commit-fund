import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Phone,
  Mail,
  Copy,
  RefreshCw
} from "lucide-react";

interface ReminderData {
  name: string;
  phone: string | null;
  email: string;
  totalPaid: number;
  remaining: number;
  status: 'completed' | 'in_progress' | 'not_started';
  message: string;
  whatsappLink: string | null;
  hasPhone: boolean;
}

interface ReminderSummary {
  totalMembers: number;
  targetedMembers: number;
  withPhone: number;
  withoutPhone: number;
  daysLeft: number;
  totalCollected: number;
  totalRemaining: number;
}

interface ReminderResponse {
  success: boolean;
  sendType: string;
  targetGroup: string;
  summary: ReminderSummary;
  reminders: ReminderData[];
}

type TargetGroup = 'all' | 'incomplete' | 'not_started' | 'in_progress';

// Format phone for WhatsApp (Kenyan format)
function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
}

function buildWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  // Default to WhatsApp Web (more reliable on desktop browsers)
  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
}

function buildWhatsAppAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  // Mobile deep-link (works when WhatsApp is installed)
  return `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
}

function buildWhatsAppWebLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
}

export function ReminderManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [reminderData, setReminderData] = useState<ReminderResponse | null>(null);
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('incomplete');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});

  const isMobileDevice =
    typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-reminders', {
        body: { sendType: 'preview', targetGroup }
      });

      if (error) throw error;
      
      setReminderData(data);
      toast({
        title: "Reminders Generated",
        description: `Found ${data.reminders.length} members to remind`,
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error",
        description: "Failed to generate reminders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const targetGroups: { value: TargetGroup; label: string; icon: React.ReactNode }[] = [
    { value: 'incomplete', label: 'All Incomplete', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'not_started', label: 'Not Started', icon: <Clock className="w-4 h-4" /> },
    { value: 'in_progress', label: 'In Progress', icon: <Users className="w-4 h-4" /> },
    { value: 'all', label: 'Everyone', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Send Reminders
            </CardTitle>
            <CardDescription>
              Generate WhatsApp messages for members who need a nudge
            </CardDescription>
          </div>
          {reminderData && (
            <Button variant="ghost" size="icon" onClick={fetchReminders}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Group Selection */}
        <div className="flex flex-wrap gap-2">
          {targetGroups.map((group) => (
            <Button
              key={group.value}
              variant={targetGroup === group.value ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setTargetGroup(group.value)}
            >
              {group.icon}
              {group.label}
            </Button>
          ))}
        </div>

        {/* Generate Button */}
        <Button 
          onClick={fetchReminders} 
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Generate Reminder Messages
            </>
          )}
        </Button>

        {/* Summary */}
        {reminderData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{reminderData.summary.targetedMembers}</p>
              <p className="text-xs text-muted-foreground">To Remind</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{reminderData.summary.withPhone}</p>
              <p className="text-xs text-muted-foreground">With Phone</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{reminderData.summary.withoutPhone}</p>
              <p className="text-xs text-muted-foreground">No Phone</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">{reminderData.summary.daysLeft}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
          </div>
        )}

        {/* Member List with WhatsApp Links */}
        {reminderData && reminderData.reminders.filter(m => m.hasPhone).length > 0 && (
          <div className="space-y-2 pt-4 border-t max-h-96 overflow-y-auto">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Click to expand and send reminder:
            </p>
            {reminderData.reminders.filter(m => m.hasPhone).map((member) => (
              <div 
                key={member.email}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedMember(
                    expandedMember === member.email ? null : member.email
                  )}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      member.status === 'completed' 
                        ? 'bg-success/10 text-success' 
                        : member.status === 'in_progress'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        KES {member.totalPaid} / 700
                        {member.remaining > 0 && ` • KES ${member.remaining} left`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.hasPhone ? (
                      <Phone className="w-4 h-4 text-success" />
                    ) : (
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    )}
                    {member.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : member.status === 'in_progress' ? (
                      <Clock className="w-4 h-4 text-warning" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedMember === member.email && (
                  <div className="p-3 bg-muted/30 border-t space-y-3">
                    <div className="bg-background p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {editedMessages[member.email] ?? member.message}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Edit message (optional)</p>
                      <Textarea
                        value={editedMessages[member.email] ?? member.message}
                        onChange={(e) =>
                          setEditedMessages((prev) => ({
                            ...prev,
                            [member.email]: e.target.value,
                          }))
                        }
                        className="min-h-[96px] text-sm"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {member.whatsappLink ? (
                        <>
                          <a
                            href={(isMobileDevice ? buildWhatsAppAppLink : buildWhatsAppWebLink)(
                              member.phone!,
                              editedMessages[member.email] ?? member.message
                            )}
                            target="_top"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              // Force same-tab navigation (embeds may ignore target on anchors)
                              e.preventDefault();
                              const url = (isMobileDevice ? buildWhatsAppAppLink : buildWhatsAppWebLink)(
                                member.phone!,
                                editedMessages[member.email] ?? member.message
                              );
                              try {
                                window.top?.location.assign(url);
                              } catch {
                                window.location.assign(url);
                              }
                            }}
                            className="inline-flex items-center justify-center gap-2 flex-1 h-10 sm:h-8 px-4 sm:px-3 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all touch-manipulation"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {isMobileDevice ? "Open WhatsApp App" : "Open WhatsApp Web"}
                          </a>

                          {/* Secondary option */}
                          <a
                            href={buildWhatsAppWebLink(
                              member.phone!,
                              editedMessages[member.email] ?? member.message
                            )}
                            target="_top"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              const url = buildWhatsAppWebLink(
                                member.phone!,
                                editedMessages[member.email] ?? member.message
                              );
                              try {
                                window.top?.location.assign(url);
                              } catch {
                                window.location.assign(url);
                              }
                            }}
                            className="inline-flex items-center justify-center gap-2 flex-1 h-10 sm:h-8 px-4 sm:px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-muted/50 active:scale-[0.98] transition-all touch-manipulation"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Open Web
                          </a>
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" className="gap-2 flex-1 h-10 sm:h-8" disabled>
                          <Phone className="w-4 h-4" />
                          No Phone Number
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 h-10 sm:h-8"
                        onClick={() => copyMessage(editedMessages[member.email] ?? member.message)}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {reminderData && reminderData.reminders.filter(m => m.hasPhone).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No members with phone numbers match the selected criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}