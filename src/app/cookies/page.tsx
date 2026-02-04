import React from 'react';
import { Cookie, Settings, BarChart3, ShieldCheck, Info } from 'lucide-react';
import Image from 'next/image';

export default function CookiePolicyPage() {
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
            <Cookie className="h-4 w-4" />
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We use cookies to improve your experience, analyze site traffic, and personalize content. This policy explains what cookies are and how we use them.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-4 mt-0">
              <Info className="h-6 w-6 text-blue-400" />
              1. What Are Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
              Cookies can be "persistent" or "session" cookies.
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Settings className="h-6 w-6 text-muted-foreground" />
                2. How We Use Cookies
              </h2>
              <p className="text-muted-foreground mb-6">When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:</p>
              
              <div className="grid gap-4">
                <div className="bg-card p-6 rounded-xl border border-border flex gap-4">
                  <div className="bg-emerald-500/10 p-3 rounded-lg h-fit">
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 mt-0">Essential Cookies</h3>
                    <p className="text-sm text-muted-foreground mb-0">
                      These are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot disable these.
                    </p>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border flex gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-lg h-fit">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 mt-0">Analytics Cookies</h3>
                    <p className="text-sm text-muted-foreground mb-0">
                      We use these to understand how visitors interact with our website, helping us improve the user experience. These collect information anonymously.
                    </p>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border flex gap-4">
                  <div className="bg-purple-500/10 p-3 rounded-lg h-fit">
                    <Settings className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 mt-0">Functionality Cookies</h3>
                    <p className="text-sm text-muted-foreground mb-0">
                      These allow us to remember choices you make (such as your preferred server region or language) to provide a more personalized experience.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mb-6">
                <Cookie className="h-6 w-6 text-amber-500" />
                3. Your Choices
              </h2>
              <p className="text-muted-foreground">
                If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
                Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
              </p>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground">
                <p className="mb-2 font-bold text-foreground">Browser Help Pages:</p>
                <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 list-none pl-0 mt-0">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Apple Safari</a></li>
                  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Microsoft Edge</a></li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
