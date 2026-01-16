import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Server, 
  Key, 
  FileCheck, 
  UserCheck,
  Database,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

export default function ClientDataSecurity() {
  const securityFeatures = [
    {
      icon: EyeOff,
      title: "Data Masking",
      description: "All sensitive information including phone numbers, emails, and personal identifiers are automatically masked when displayed or transmitted.",
      details: [
        "Phone numbers shown as +91****3279",
        "Email addresses shown as a***@example.com",
        "Full names displayed with partial masking",
        "Internal IDs never exposed to clients"
      ]
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All call transcripts, summaries, and extracted data are encrypted using AES-256-GCM encryption before storage.",
      details: [
        "Military-grade AES-256 encryption",
        "Unique encryption keys per tenant",
        "Data encrypted at rest and in transit",
        "Secure key management system"
      ]
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Strict access controls ensure you only see data that belongs to your account. No cross-tenant data exposure.",
      details: [
        "Row Level Security (RLS) on all tables",
        "Client-specific data isolation",
        "Admin and client role separation",
        "Automatic ownership verification"
      ]
    },
    {
      icon: Server,
      title: "Secure API Gateway",
      description: "All API requests pass through our secure proxy that validates authentication and filters sensitive data.",
      details: [
        "Zero-trust architecture",
        "JWT token validation",
        "Request sanitization",
        "Rate limiting protection"
      ]
    },
    {
      icon: Key,
      title: "Secure Authentication",
      description: "Multi-factor authentication with OTP verification ensures only authorized users access the system.",
      details: [
        "Phone OTP verification",
        "Session timeout after 20 minutes",
        "Secure password requirements",
        "Failed attempt lockouts"
      ]
    },
    {
      icon: Database,
      title: "Data Isolation",
      description: "Your data is completely isolated from other clients. System prompts and AI configurations are never exposed.",
      details: [
        "Tenant-isolated databases",
        "No shared data access",
        "Secure multi-tenancy",
        "Audit logging enabled"
      ]
    }
  ];

  const dataFlow = [
    {
      step: 1,
      title: "Your Request",
      description: "You make a request to view call data or agent information",
      icon: UserCheck
    },
    {
      step: 2,
      title: "Authentication Check",
      description: "System verifies your identity and role permissions",
      icon: Fingerprint
    },
    {
      step: 3,
      title: "Data Filtering",
      description: "Only your owned data is retrieved, others blocked by RLS",
      icon: FileCheck
    },
    {
      step: 4,
      title: "Sensitive Data Masking",
      description: "Phone numbers, emails, and IDs are automatically masked",
      icon: EyeOff
    },
    {
      step: 5,
      title: "Encryption Layer",
      description: "Transcripts and summaries are encrypted before transmission",
      icon: Lock
    },
    {
      step: 6,
      title: "Secure Delivery",
      description: "Sanitized, encrypted data delivered to your dashboard",
      icon: ShieldCheck
    }
  ];

  const protectedDataTypes = [
    { type: "Call Transcripts", protection: "AES-256 Encrypted", level: "high" },
    { type: "Call Summaries", protection: "AES-256 Encrypted", level: "high" },
    { type: "Phone Numbers", protection: "Masked Display", level: "medium" },
    { type: "Email Addresses", protection: "Masked Display", level: "medium" },
    { type: "System Prompts", protection: "Never Exposed", level: "high" },
    { type: "AI Configurations", protection: "Never Exposed", level: "high" },
    { type: "Internal IDs", protection: "Masked/Hidden", level: "medium" },
    { type: "Recording URLs", protection: "Proxied Access", level: "high" },
    { type: "Lead Data", protection: "Owner-Only Access", level: "high" },
    { type: "Campaign Data", protection: "Owner-Only Access", level: "high" }
  ];

  return (
    <DashboardLayout role="client">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Data Security</h1>
            <p className="text-muted-foreground">
              How Aitel protects your data and ensures privacy
            </p>
          </div>
        </div>

        {/* Trust Badge */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <ShieldCheck className="h-12 w-12 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Enterprise-Grade Security</h2>
                <p className="text-muted-foreground">
                  Your data is protected with the same security standards used by financial institutions. 
                  All sensitive information is encrypted, masked, and isolated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Flow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              How Your Data Request Is Processed
            </CardTitle>
            <CardDescription>
              Every data request goes through multiple security layers before reaching you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dataFlow.map((step) => (
                <div 
                  key={step.step} 
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <step.icon className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Protected Data Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Protected Data Types
            </CardTitle>
            <CardDescription>
              Overview of how different data types are protected in the Aitel platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {protectedDataTypes.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <span className="font-medium">{item.type}</span>
                  <Badge 
                    variant={item.level === "high" ? "default" : "secondary"}
                    className={item.level === "high" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {item.protection}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What We Never Expose */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              What We Never Expose
            </CardTitle>
            <CardDescription>
              These sensitive items are never visible to clients or in network requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Raw System Prompts",
                "AI Provider API Keys",
                "Other Client's Data",
                "Internal System IDs",
                "Database Credentials",
                "Encryption Keys",
                "Admin-Only Metrics",
                "Raw Recording URLs"
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg border border-destructive/20 bg-background"
                >
                  <EyeOff className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Common questions about data security and privacy at Aitel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How is my call data protected?</AccordionTrigger>
                <AccordionContent>
                  All call transcripts, summaries, and extracted data are encrypted using AES-256-GCM encryption 
                  before being stored. This is the same encryption standard used by banks and government agencies. 
                  Your data is decrypted only when you request to view it, and the decryption happens server-side 
                  with your authenticated session.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Can other clients see my data?</AccordionTrigger>
                <AccordionContent>
                  Absolutely not. Aitel implements strict Row Level Security (RLS) policies on all database tables. 
                  This means that even at the database level, queries are automatically filtered to only return 
                  data that belongs to your account. There is no possibility of cross-tenant data exposure.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Why are phone numbers and emails masked?</AccordionTrigger>
                <AccordionContent>
                  Phone numbers and email addresses are considered Personally Identifiable Information (PII). 
                  We mask these in displays and network responses to prevent accidental exposure or data scraping. 
                  You can still identify records through partial information while maintaining security. 
                  Full details are only accessible through secure, authenticated endpoints when absolutely necessary.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What happens to my data when I make an API call?</AccordionTrigger>
                <AccordionContent>
                  Every API request goes through our secure proxy layer. First, your authentication token is 
                  validated. Then, the system verifies your role and ownership of the requested data. Sensitive 
                  fields are automatically masked or encrypted before being sent to your browser. This ensures 
                  that even if network traffic were intercepted, the data would be meaningless to attackers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Can I access my AI agent's system prompts?</AccordionTrigger>
                <AccordionContent>
                  For security reasons, raw system prompts are never exposed to clients. This protects your 
                  AI agent configurations from being reverse-engineered or copied. You can view high-level 
                  agent settings and capabilities, but the detailed prompts that power your agents remain 
                  securely stored and encrypted on our servers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>How long is my session valid?</AccordionTrigger>
                <AccordionContent>
                  For security, your session automatically expires after 20 minutes of inactivity. This helps 
                  protect your account if you forget to log out or leave your device unattended. You'll be 
                  prompted to log in again when your session expires. We recommend logging out manually when 
                  you're finished using the platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>How are call recordings protected?</AccordionTrigger>
                <AccordionContent>
                  Call recordings are stored in secure, encrypted storage. When you request to play a recording, 
                  the URL is proxied through our secure servers rather than exposing the direct storage URL. 
                  This prevents unauthorized access and ensures that only authenticated users can access 
                  recordings they own.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>What data can Aitel employees see?</AccordionTrigger>
                <AccordionContent>
                  Our admin team has access to manage the platform, but even internal access is limited and 
                  logged. Sensitive client data like call transcripts and summaries are encrypted, and access 
                  is strictly controlled. We follow the principle of least privilege—employees only have access 
                  to what's necessary for their specific role.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>Is my data backed up?</AccordionTrigger>
                <AccordionContent>
                  Yes, all data is regularly backed up with encrypted backups stored in secure, geographically 
                  distributed locations. Backups are encrypted using the same AES-256 standard as live data. 
                  In case of any system issues, your data can be restored without any loss.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger>How do I report a security concern?</AccordionTrigger>
                <AccordionContent>
                  If you notice any suspicious activity, potential security vulnerabilities, or have concerns 
                  about your data, please contact our security team immediately. You can reach us through the 
                  Settings page or by contacting your account manager. We take all security reports seriously 
                  and investigate them promptly.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Security */}
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Have Security Concerns?</h3>
              <p className="text-muted-foreground">
                If you have any questions about data security or notice any suspicious activity, 
                please contact our security team immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
