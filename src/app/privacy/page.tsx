import React from 'react';
import { Shield, Lock, Eye, Server, Mail, Globe } from 'lucide-react';
import Image from 'next/image';

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We are committed to protecting your personal data and ensuring your experience with AlbionKit is safe and secure.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
              <Eye className="h-6 w-6 text-blue-400" />
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to AlbionKit ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Server className="h-6 w-6 text-purple-400" />
                2. Data We Collect
              </h2>
              <p className="text-muted-foreground mb-4">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">Identity & Contact Data</h3>
                  <p className="text-sm text-muted-foreground">Includes username, email address, and any profile information you choose to provide (such as in-game character names).</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">Technical Data</h3>
                  <p className="text-sm text-muted-foreground">Internet protocol (IP) address, login data, browser type and version, time zone setting, and operating system.</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">Usage Data</h3>
                  <p className="text-sm text-muted-foreground">Information about how you use our website, products, and services, including tool usage patterns.</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-2">Transaction Data</h3>
                  <p className="text-sm text-muted-foreground">Details about payments to and from you and other details of products you have purchased from us (processed securely via Lemon Squeezy).</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Lock className="h-6 w-6 text-emerald-400" />
                3. How We Use Your Data
              </h2>
              <p className="text-muted-foreground mb-4">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5" />
                  <span>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., providing premium features).</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5" />
                  <span>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5" />
                  <span>Where we need to comply with a legal or regulatory obligation.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Globe className="h-6 w-6 text-amber-400" />
                4. Third-Party Links & Services
              </h2>
              <p className="text-muted-foreground mb-4">
                This website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. 
                We do not control these third-party websites and are not responsible for their privacy statements.
              </p>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-bold text-foreground mb-2">Key Third-Party Processors</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><strong>Google Firebase:</strong> Used for authentication and database services.</li>
                  <li><strong>Lemon Squeezy:</strong> Used as our Merchant of Record for payments and subscriptions.</li>
                  <li><strong>Albion Data Project:</strong> We consume public market data but do not send your personal data to them.</li>
                </ul>
              </div>
            </section>

            <section className="bg-muted/50 border border-border rounded-xl p-8">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
                <Mail className="h-6 w-6 text-muted-foreground" />
                Contact Us
              </h2>
              <p className="text-muted-foreground mb-0">
                If you have any questions about this privacy policy or our privacy practices, please contact us via our Discord community or email at support@ao-pocket.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
