import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileText, Sparkles, Download, Zap, CheckCircle2, TrendingUp } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Optimization',
      description: 'Get intelligent suggestions to improve your CV and beat ATS systems'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Professional Templates',
      description: 'Choose from modern, traditional, and creative CV designs'
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: 'Instant PDF Export',
      description: 'Download your polished CV as a high-quality PDF in seconds'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'ATS Optimization',
      description: 'Ensure your CV passes Applicant Tracking Systems with 85+ score'
    }
  ];

  const benefits = [
    'Import your LinkedIn data instantly',
    'Real-time CV preview as you type',
    'AI-powered content suggestions',
    'Multiple CV versions for different jobs',
    'ATS compatibility scoring',
    'One-click PDF download'
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0b]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-[#0066ff]" />
              <span className="text-2xl font-bold text-white">CVCraft</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </nav>
            <Button 
              onClick={() => navigate('/create')} 
              className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
            >
              Create CV
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0066ff]/10 border border-[#0066ff]/20 mb-8">
              <Zap className="w-4 h-4 text-[#0066ff]" />
              <span className="text-sm text-[#0066ff] font-medium">AI-Powered CV Builder</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Create Professional CVs in
              <span className="text-[#0066ff]"> Minutes</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Transform your LinkedIn profile into a stunning, ATS-optimized CV with AI-powered suggestions. Stand out from the crowd and land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/create')} 
                size="lg"
                className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-lg px-8 py-6"
              >
                <FileText className="w-5 h-5 mr-2" />
                Start Building Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-700 text-white hover:bg-gray-800 text-lg px-8 py-6"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                See Examples
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-[#0f0f10]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-400">
              Powerful features designed to help you create the perfect CV
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-[#1a1a1c] border border-gray-800 rounded-2xl p-8 hover:border-[#0066ff]/50 transition-all hover:scale-105"
              >
                <div className="text-[#0066ff] mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Build Your CV in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-400">
              From LinkedIn data to polished PDF in minutes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Input Your Data',
                description: 'Enter your professional information from LinkedIn or start from scratch'
              },
              {
                step: '02',
                title: 'Customize & Optimize',
                description: 'Use AI suggestions to enhance your content and choose your template'
              },
              {
                step: '03',
                title: 'Download & Apply',
                description: 'Export your ATS-optimized CV as PDF and start applying'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-[#0066ff]/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-[#0f0f10]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose CVCraft?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                We've built the most advanced CV builder to help you land interviews faster.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#0066ff] flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#0066ff]/10 to-[#0066ff]/5 rounded-3xl p-12 border border-[#0066ff]/20">
              <div className="space-y-8">
                <div>
                  <div className="text-5xl font-bold text-white mb-2">85+</div>
                  <div className="text-gray-400">Average ATS Score</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2">10K+</div>
                  <div className="text-gray-400">CVs Created</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2">5 min</div>
                  <div className="text-gray-400">Average Creation Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your Perfect CV?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of professionals who've landed their dream jobs with CVCraft
          </p>
          <Button 
            onClick={() => navigate('/create')} 
            size="lg"
            className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-lg px-12 py-6"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Your CV Now - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-[#0066ff]" />
                <span className="text-xl font-bold text-white">CVCraft</span>
              </div>
              <p className="text-gray-400">
                Create professional CVs with AI-powered optimization
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CV Examples</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CVCraft. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
