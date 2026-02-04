import React from 'react';
import { Scale, FileText, ShieldAlert, UserCheck, AlertTriangle, Copyright } from 'lucide-react';
import Image from 'next/image';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-20 px-4 overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/bg-1.jpg"
            alt="Background"
            fill
            className="object-cover opacity-30"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/90 to-background" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium mb-6">
            <FileText className="h-4 w-4" />
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using AlbionKit. They outline your rights, responsibilities, and our legal obligations.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
              <Scale className="h-6 w-6 text-amber-500" />
              1. Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using AlbionKit, you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you disagree with any part of the terms, then you may not access the service. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Copyright className="h-6 w-6 text-blue-400" />
                2. Intellectual Property
              </h2>
              <p className="text-muted-foreground mb-4">
            The Service and its original content (excluding user-generated content), features, and functionality are and will remain the exclusive property of AlbionKit and its licensors.
        </p>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-bold text-foreground mb-2">Albion Online IP</h3>
                <p className="text-sm text-muted-foreground mb-0">
                  Albion Online and the Albion Online logo are trademarks of Sandbox Interactive GmbH. 
                  AlbionKit is a community-created tool and is not affiliated with, endorsed by, or sponsored by Sandbox Interactive GmbH.
                  All game assets used are property of their respective owners.
                </p>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <UserCheck className="h-6 w-6 text-emerald-400" />
                3. User Accounts
              </h2>
              <p className="text-muted-foreground mb-4">
                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
                Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
              <ul className="grid md:grid-cols-2 gap-4 list-none pl-0">
                <li className="bg-card p-4 rounded-lg border border-border">
                  <span className="font-bold text-foreground block mb-1">Account Security</span>
                  <span className="text-sm text-muted-foreground">You are responsible for safeguarding the password that you use to access the Service.</span>
                </li>
                <li className="bg-card p-4 rounded-lg border border-border">
                  <span className="font-bold text-foreground block mb-1">Acceptable Use</span>
                  <span className="text-sm text-muted-foreground">You may not use the Service for any illegal or unauthorized purpose.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <ShieldAlert className="h-6 w-6 text-red-400" />
                4. Termination
              </h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
                5. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                In no event shall AlbionKit, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
