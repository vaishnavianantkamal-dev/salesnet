import { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function PublicLandingPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch landing config as an unauthenticated request if possible, 
    // or just use api instance (which sends token if present)
    const fetchConfig = async () => {
      try {
        const res = await api.get('/api/landing');
        setConfig(res.data.data);
      } catch (err) {
        console.error('Failed to load landing page', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!config || config.isDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Website Currently Unavailable</h1>
        <Link to="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  const { hero, features, branding, header, platform, pricing, testimonials, faq, contact, footer } = config;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SalesNets CRM',
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Navbar */}
      <nav className="border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          {header?.brandLogo ? (
            <img src={header.brandLogo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="font-bold text-xl tracking-tight text-emerald-600">SalesNest</div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link to="#features" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Features</Link>
          <Link to="#pricing" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleShare} className="text-sm font-medium flex items-center gap-1 text-slate-600 hover:text-emerald-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Log in</Link>
          <Link to="/login">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          {hero?.sectionTitle || 'Supercharge your Sales with AI CRM'}
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {hero?.description || 'Automate follow-ups, score leads instantly, and close deals faster than ever before. Built for modern sales teams.'}
        </p>
        <Link to="/login">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-14 px-8 rounded-full shadow-lg shadow-emerald-500/30">
            {hero?.primaryButton?.label || 'Start Free Trial'}
          </Button>
        </Link>
      </section>

      {/* Trust Branding */}
      <section className="py-12 bg-slate-50 border-y border-slate-100 text-center overflow-hidden">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
          {branding?.trustedLabelText || 'Trusted by innovative teams worldwide'}
        </p>
        <div className="relative flex overflow-x-hidden group max-w-6xl mx-auto">
          <div className="animate-marquee flex whitespace-nowrap items-center space-x-16 px-8">
            {branding?.brandLogos?.map((logo, i) => (
              <img key={`logo-1-${i}`} src={logo} alt={`Trust Logo ${i}`} className="h-8 md:h-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-300 object-contain inline-block" />
            ))}
            {branding?.brandLogos?.map((logo, i) => (
              <img key={`logo-2-${i}`} src={logo} alt={`Trust Logo ${i}`} className="h-8 md:h-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-300 object-contain inline-block" />
            ))}
          </div>
          {/* Add CSS for marquee inline or assume Tailwind extends it. We will just use standard CSS animation here */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 25s linear infinite;
              min-width: 200%;
            }
          `}} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-4">
            {features?.sectionBadge || 'Features'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {features?.headline || 'Everything you need to succeed'}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {features?.descriptionText || 'From lead capture to final conversion, we provide all the tools your team needs.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {features?.highlights?.map((highlight, i) => (
            <div key={i} className="group flex flex-col p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2">
              <div className="w-full h-48 mb-8 rounded-2xl overflow-hidden bg-slate-100 relative">
                <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-transparent transition-colors z-10"></div>
                <img src={highlight.mediaUrl} alt={highlight.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{highlight.title}</h3>
              <p className="text-slate-600 leading-relaxed flex-1">{highlight.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
              {platform?.sectionBadge || 'Platform'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {platform?.mainHeadline || 'How it Works'}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {platform?.nodes?.map((node, i) => (
              <div key={i} className="flex flex-col bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 font-bold text-xl">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{node.stepTitle.replace(/^\d+\.\s*/, '')}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed flex-1">{node.briefNarrative}</p>
                <ul className="space-y-3 mt-auto pt-6 border-t border-slate-100">
                  {node.keyFeatures?.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 md:px-12 bg-white text-center">
        <div className="max-w-6xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
            {testimonials?.sectionBadge || 'Testimonials'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-16">{testimonials?.headline || 'Loved by sales teams worldwide'}</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'VP of Sales, TechFlow', content: 'SalesNets completely transformed our pipeline management. Our team is closing 30% more deals.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
              { name: 'David Chen', role: 'Founder, GrowthWorks', content: 'The easiest CRM we have ever used. The automated outreach sequences save us hours every single day.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' },
              { name: 'Elena Rodriguez', role: 'Marketing Director, Nova', content: 'The landing page builder combined with the CRM is a game-changer. Everything is in one place.', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop' }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-left relative group hover:shadow-lg transition-shadow">
                <div className="text-emerald-400 mb-6">
                  <svg className="w-10 h-10 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-8">"{testimonial.content}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <img src={testimonial.avatarUrl} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 text-white px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              {pricing?.sectionBadge || 'Pricing'}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{pricing?.sectionTitle || 'Simple, transparent pricing'}</h2>
            <p className="text-slate-400 text-lg">{pricing?.briefDescription || 'Choose the perfect plan for your growing business.'}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {[
              { name: 'Starter', price: '$29', period: '/month', features: ['Up to 5 Users', 'Basic CRM', '1,000 Contacts', 'Email Support'], isPopular: false },
              { name: 'Professional', price: '$99', period: '/month', features: ['Up to 20 Users', 'Advanced Automations', 'Unlimited Contacts', 'Priority Support', 'Custom Domains'], isPopular: true },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Users', 'Dedicated Success Manager', 'SSO & Advanced Security', 'Custom Integrations'], isPopular: false }
            ].map((plan, i) => (
              <div key={i} className={`p-8 rounded-3xl border ${plan.isPopular ? 'bg-emerald-600 border-emerald-500 transform md:-translate-y-4 shadow-2xl shadow-emerald-900/50 relative' : 'bg-slate-800 border-slate-700'}`}>
                {plan.isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>}
                <h3 className={`text-xl font-bold mb-2 ${plan.isPopular ? 'text-emerald-50' : 'text-white'}`}>{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={plan.isPopular ? 'text-emerald-100 text-sm' : 'text-slate-400 text-sm'}>{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <svg className={`w-5 h-5 ${plan.isPopular ? 'text-emerald-200' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      <span className={plan.isPopular ? 'text-emerald-50' : 'text-slate-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full h-12 rounded-full font-bold ${plan.isPopular ? 'bg-white text-emerald-700 hover:bg-slate-100' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{faq?.mainHeadline || 'Frequently Asked Questions'}</h2>
          <p className="text-slate-600">{faq?.contextualDescription}</p>
        </div>
        <div className="space-y-6">
          {faq?.questions?.map((q, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-lg font-bold text-slate-900 mb-2">{q.question}</h4>
              <p className="text-slate-600">{q.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-emerald-900 text-white text-center px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{contact?.sectionTitle || 'Get in Touch'}</h2>
          <p className="text-emerald-100 text-lg mb-8">{contact?.narrative}</p>
          <div className="flex flex-col md:flex-row justify-center gap-8 mb-10">
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              <span>{contact?.businessPhone}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <span>{contact?.corporateEmail}</span>
            </div>
          </div>
          <Link to="/login">
            <Button className="bg-white text-emerald-900 hover:bg-slate-100 h-12 px-8 rounded-full font-bold">Contact Support</Button>
          </Link>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden bg-emerald-900 text-white text-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">{footer?.preFooterCtaTitle || 'Ready to boost your sales?'}</h2>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">{footer?.ctaSupportingDescription || 'Join thousands of satisfied customers today.'}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button className="bg-white text-emerald-900 hover:bg-slate-100 h-14 px-10 rounded-full text-lg font-bold shadow-xl shadow-emerald-950/50">
                {footer?.globalActionButtons?.[0]?.label || 'Start Free Trial'}
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="text-white border-white hover:bg-emerald-800 h-14 px-8 rounded-full text-lg font-semibold bg-transparent">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400 text-center px-6 md:px-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-white">SalesNest</span>
          </div>
          <div className="flex gap-6">
            {footer?.socialLinks?.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{link.platform}</a>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 text-sm">
          {footer?.copyrightDisclaimer || '© 2024 SalesNest. All rights reserved.'}
        </div>
      </footer>
    </div>
  );
}
