import { Mail, Github, Linkedin, Globe, Code2, MapPin } from 'lucide-react';

const AboutPage = () => {
  // 👇 REPLACE THESE STRINGS WITH YOUR REAL DETAILS
  const myDetails = {
    name: "Shubham Bhardwaj",
    title: "Full Stack Engineer & Founder",
    // Use your GitHub avatar or any public image URL
    photoUrl: "https://avatars.githubusercontent.com/u/YOUR_GITHUB_USERNAME?v=4", 
    portfolioUrl: "https://your-portfolio-website.com",
    linkedinUrl: "https://www.linkedin.com/in/your-profile-id/",
    githubUrl: "https://github.com/bhadwajshubham",
    email: "shubham@example.com", // Optional
    bio: "I built UniFlow to solve the chaos of event management. My goal is to create scalable, user-centric software that makes a real impact."
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          Meet the <span className="text-indigo-600">Architect</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
          UniFlow was built with a vision to simplify campus life using cutting-edge technology.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col md:flex-row items-center gap-8">
        
        {/* Photo Area */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative w-48 h-48 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 flex items-center justify-center">
             {/* If photo fails, it falls back to an avatar */}
             <img 
               src={myDetails.photoUrl} 
               onError={(e) => e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Shubham"}
               alt={myDetails.name} 
               className="w-full h-full object-cover"
             />
          </div>
        </div>

        {/* Info Area */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{myDetails.name}</h2>
            <p className="text-indigo-600 font-medium">{myDetails.title}</p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-400">React + Vite</span>
            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-400">Firebase Auth</span>
            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-400">Tailwind CSS</span>
          </div>

          <p className="text-zinc-500 text-sm leading-relaxed">
            "{myDetails.bio}"
          </p>

          {/* Social Links */}
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
            
            {/* GitHub (Always Include) */}
            <a href={myDetails.githubUrl} target="_blank" rel="noreferrer" className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" title="GitHub">
              <Github className="h-5 w-5" />
            </a>

            {/* LinkedIn (Highly Recommended) */}
            <a href={myDetails.linkedinUrl} target="_blank" rel="noreferrer" className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors" title="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>

            {/* Portfolio (Optional - Only shows if you change the link) */}
            {myDetails.portfolioUrl !== "https://your-portfolio-website.com" && (
                <a href={myDetails.portfolioUrl} target="_blank" rel="noreferrer" className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Portfolio">
                <Globe className="h-5 w-5" />
                </a>
            )}

            {/* Email (Optional - Uncomment if you want it) */}
            {/* <a href={`mailto:${myDetails.email}`} className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <Mail className="h-5 w-5" />
            </a> 
            */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;