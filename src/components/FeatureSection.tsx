'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureSectionProps {
  title: string;
  description: string;
  link: string;
  linkText?: string;
  backgroundImage: string;
  previewImageLight: string;
  previewImageDark: string;
  reverse?: boolean;
}

export function FeatureSection({
  title,
  description,
  link,
  linkText = "Try it now",
  backgroundImage,
  previewImageLight,
  previewImageDark,
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="relative w-full min-h-[500px] md:min-h-[500px] flex items-center justify-center overflow-hidden py-24 group">
       {/* Background Image (Static) */}
       <div 
         className="absolute inset-0 z-0"
         style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
         }}
       />
       
       {/* Overlay - Gradient + Blur */}
       <div className="absolute inset-0 z-0 bg-background/90 backdrop-blur-[3px] bg-gradient-to-b from-background via-background/80 to-background" />
       
       <div className="container relative z-10 px-4 md:px-6">
         <div className={cn(
           "flex flex-col items-center gap-12 lg:gap-24",
           reverse ? "lg:flex-row-reverse" : "lg:flex-row"
         )}>
           {/* Text Content */}
           <div className="flex-1 space-y-6 text-center lg:text-left">
             <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground drop-shadow-md">{title}</h2>
             <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
               {description}
             </p>
             <div className="pt-4 flex justify-center lg:justify-start">
               <Link 
                 href={link}
                 className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20 hover:shadow-primary/40"
               >
                 {linkText}
                 <ArrowRight className="w-5 h-5" />
               </Link>
             </div>
           </div>
           
           {/* Preview Image with Parallax */}
          <div className="flex-1 w-full max-w-[650px]">
            <div className="group/card relative h-[300px] md:h-[350px] w-full rounded-xl border border-border/50 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm transform transition-all duration-700 hover:scale-[1.02] hover:shadow-primary/10 group-hover:border-primary/20">
               {/* Light Mode Image */}
               <Image
                 src={previewImageLight}
                 alt={`${title} Preview`}
                 fill
                 className="object-cover object-top block dark:hidden transition-[object-position] duration-[15000ms] ease-in-out group-hover/card:object-bottom"
                 sizes="(max-width: 768px) 100vw, 650px"
                 quality={90}
               />
               {/* Dark Mode Image */}
               <Image
                 src={previewImageDark}
                 alt={`${title} Preview`}
                 fill
                 className="object-cover object-top hidden dark:block transition-[object-position] duration-[15000ms] ease-in-out group-hover/card:object-bottom"
                 sizes="(max-width: 768px) 100vw, 650px"
                 quality={90}
               />
               
               {/* Shine effect on hover */}
               <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            </div>
          </div>
         </div>
       </div>
    </section>
  )
}
