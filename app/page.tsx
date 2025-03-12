"use client"
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coins, Heart, Shield, ArrowRight, CheckCircle, Users, Globe, ChartBar, Leaf, TreePine, Sprout } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Spline from '@splinetool/react-spline';

export default function Home() {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-800 to-teal-900">
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0 z-0">
          <Spline scene="https://prod.spline.design/ciOnq7-5qpu4C4XV/scene.splinecode" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-6xl font-bold mb-6 text-white leading-tight">
             
            </h1>
            <p className="text-xl text-white/90 mb-8">
              
            </p>
            <div className="flex gap-4">
              
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div 
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={fadeIn}
        className="py-24 bg-black/20 backdrop-blur-lg"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-green-300 mb-16">Why Choose Us?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure & Transparent",
                description: "All transactions are recorded on the Solana blockchain for complete transparency."
              },
              {
                icon: Leaf,
                title: "Verified Impact",
                description: "Every milestone is verified by trusted oracles before funds are released."
              },
              {
                icon: TreePine,
                title: "Community Driven",
                description: "Join a community of donors and organizations making real change."
              },
              {
                icon: Sprout,
                title: "Track Progress",
                description: "Monitor the impact of your donations in real-time with detailed analytics."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="bg-emerald-900/30 backdrop-blur-lg rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300 border border-green-500/20"
              >
                <feature.icon className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-300">{feature.title}</h3>
                <p className="text-green-100/80">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div 
        className="py-24"
        initial="hidden"
        animate={controls}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-green-300 mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create or Choose",
                description: "Start a campaign or find a cause you want to support."
              },
              {
                step: "02",
                title: "Smart Donations",
                description: "Donate using Solana. Funds are secured by smart contracts."
              },
              {
                step: "03",
                title: "Track Impact",
                description: "Watch your donation make real-world impact with verified milestones."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="text-center"
              >
                <div className="text-6xl font-bold text-green-400 mb-4">{step.step}</div>
                <h3 className="text-2xl font-semibold mb-4 text-green-300">{step.title}</h3>
                <p className="text-green-100/80">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="py-24 bg-gradient-to-r from-emerald-900 to-green-900"
        initial="hidden"
        animate={controls}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-green-300 mb-8">Ready to Make a Difference?</h2>
          <p className="text-xl text-green-100/90 mb-8 max-w-2xl mx-auto">
            Join thousands of donors and organizations creating positive change through transparent giving.
          </p>
          <Button
            size="lg"
            className="bg-green-500 text-white hover:bg-green-600"
          >
            <Link href="/campaigns">Start Donating</Link>
          </Button>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-emerald-900/30 backdrop-blur-lg py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-green-300 mb-4">ChainImpact</h3>
              <p className="text-green-100/80">
                Revolutionizing charitable giving through blockchain technology.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-green-100/80">
                <li><Link href="/campaigns" className="hover:text-green-400 transition-colors">Explore Campaigns</Link></li>
                <li><Link href="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="/how-it-works" className="hover:text-green-400 transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-4">Resources</h4>
              <ul className="space-y-2 text-green-100/80">
                <li><Link href="/docs" className="hover:text-green-400 transition-colors">Documentation</Link></li>
                <li><Link href="/faq" className="hover:text-green-400 transition-colors">FAQ</Link></li>
                <li><Link href="/support" className="hover:text-green-400 transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-4">Connect</h4>
              <ul className="space-y-2 text-green-100/80">
                <li><Link href="/twitter" className="hover:text-green-400 transition-colors">Twitter</Link></li>
                <li><Link href="/discord" className="hover:text-green-400 transition-colors">Discord</Link></li>
                <li><Link href="/telegram" className="hover:text-green-400 transition-colors">Telegram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-500/20 mt-12 pt-8 text-center text-green-100/60">
            <p>&copy; 2024 ChainImpact. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}