import React from 'react';
import { Card } from './ui/card';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';

const CVPreview = ({ cvData, template }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <Card className="bg-white border-gray-300 p-12 shadow-2xl min-h-[1400px]">
      {/* ================= MODERN TEMPLATE ================= */}
      {template === 'modern' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b-4 border-[#0066ff] pb-6">
            <div className="flex items-start gap-6 mb-4">
              {cvData.personalInfo.profilePhoto && (
                <img 
                  src={cvData.personalInfo.profilePhoto} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#0066ff]"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {cvData.personalInfo.fullName}
                </h1>
                <p className="text-xl text-[#0066ff] font-medium mb-4">
                  {cvData.personalInfo.title}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {cvData.personalInfo.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {cvData.personalInfo.phone}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {cvData.personalInfo.location}
              </div>
              {cvData.personalInfo.linkedinUrl && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  {cvData.personalInfo.linkedinUrl}
                </div>
              )}
              {cvData.personalInfo.portfolio && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {cvData.personalInfo.portfolio}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {cvData.personalInfo.summary}
            </p>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Experience
            </h2>
            <div className="space-y-5">
              {cvData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{exp.position}</h3>
                      <p className="text-md font-semibold text-[#0066ff]">{exp.company}</p>
                      <p className="text-sm text-gray-600">{exp.location}</p>
                    </div>
                    <div className="text-sm text-gray-600 text-right">
                      {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                    </div>
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Education
            </h2>
            <div className="space-y-4">
              {cvData.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                      <p className="text-md font-semibold text-[#0066ff]">{edu.institution}</p>
                      <p className="text-sm text-gray-600">{edu.field}</p>
                      {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                    </div>
                    <div className="text-sm text-gray-600 text-right">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {cvData.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TRADITIONAL TEMPLATE ================= */}
      {template === 'traditional' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4">
            {cvData.personalInfo.profilePhoto && (
              <div className="flex justify-center mb-4">
                <img 
                  src={cvData.personalInfo.profilePhoto} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-800"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {cvData.personalInfo.fullName}
            </h1>
            <p className="text-lg text-gray-700 mb-3">
              {cvData.personalInfo.title}
            </p>
            <div className="flex justify-center flex-wrap gap-3 text-sm text-gray-600">
              <span>{cvData.personalInfo.email}</span>
              <span>|</span>
              <span>{cvData.personalInfo.phone}</span>
              <span>|</span>
              <span>{cvData.personalInfo.location}</span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
              OBJECTIVE
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {cvData.personalInfo.summary}
            </p>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              PROFESSIONAL EXPERIENCE
            </h2>
            <div className="space-y-4">
              {cvData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-md font-bold text-gray-900">{exp.position}</h3>
                    <span className="text-sm text-gray-600">
                      {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{exp.company}, {exp.location}</p>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              EDUCATION
            </h2>
            <div className="space-y-3">
              {cvData.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-md font-bold text-gray-900">{edu.degree} - {edu.field}</h3>
                      <p className="text-sm text-gray-700">{edu.institution}</p>
                      {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
              SKILLS
            </h2>
            <p className="text-sm text-gray-700">
              {cvData.skills.join(' • ')}
            </p>
          </div>
        </div>
      )}

      {/* ================= CREATIVE TEMPLATE ================= */}
      {template === 'creative' && (
        <div className="space-y-8">
          {/* Header with Color */}
          <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] text-white p-6 -m-12 mb-6">
            <div className="flex items-start gap-6">
              {cvData.personalInfo.profilePhoto && (
                <img 
                  src={cvData.personalInfo.profilePhoto} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  {cvData.personalInfo.fullName}
                </h1>
                <p className="text-xl font-medium mb-4 text-white/90">
                  {cvData.personalInfo.title}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {cvData.personalInfo.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {cvData.personalInfo.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {cvData.personalInfo.location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Skills */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-[#0066ff]">
                  SKILLS
                </h2>
                <div className="space-y-2">
                  {cvData.skills.map((skill, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      • {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-[#0066ff]">
                  LINKS
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                  {cvData.personalInfo.linkedinUrl && (
                    <div className="break-words">
                      <div className="font-semibold text-gray-900">LinkedIn</div>
                      {cvData.personalInfo.linkedinUrl}
                    </div>
                  )}
                  {cvData.personalInfo.portfolio && (
                    <div className="break-words">
                      <div className="font-semibold text-gray-900">Portfolio</div>
                      {cvData.personalInfo.portfolio}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-2 space-y-6">
              {/* Summary */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-[#0066ff]">
                  PROFILE
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {cvData.personalInfo.summary}
                </p>
              </div>

              {/* Experience */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#0066ff]">
                  EXPERIENCE
                </h2>
                <div className="space-y-5">
                  {cvData.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-md font-bold text-gray-900">{exp.position}</h3>
                        <span className="text-xs text-gray-600">
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0066ff] mb-2">{exp.company} • {exp.location}</p>
                      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#0066ff]">
                  EDUCATION
                </h2>
                <div className="space-y-4">
                  {cvData.education.map((edu) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-md font-bold text-gray-900">{edu.degree}</h3>
                          <p className="text-sm font-semibold text-[#0066ff]">{edu.institution}</p>
                          <p className="text-sm text-gray-600">{edu.field}</p>
                        </div>
                        <span className="text-xs text-gray-600">
                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MINIMALIST TEMPLATE ================= */}
      {template === 'minimalist' && (
        <div className="space-y-10 max-w-4xl mx-auto text-gray-800">
           {/* Header - Centered & Clean */}
           <div className="text-center space-y-4">
              <h1 className="text-5xl font-light tracking-wide text-gray-900 uppercase">
                {cvData.personalInfo.fullName}
              </h1>
              <p className="text-lg tracking-widest text-gray-500 uppercase">
                {cvData.personalInfo.title}
              </p>
              <div className="flex justify-center items-center flex-wrap gap-4 text-sm text-gray-500 pt-2">
                 <span>{cvData.personalInfo.email}</span>
                 <span className="text-gray-300">•</span>
                 <span>{cvData.personalInfo.phone}</span>
                 {cvData.personalInfo.location && (
                   <>
                     <span className="text-gray-300">•</span>
                     <span>{cvData.personalInfo.location}</span>
                   </>
                 )}
              </div>
           </div>

           {/* Summary - No title, just text */}
           <div className="text-center max-w-2xl mx-auto">
              <p className="text-gray-600 leading-relaxed italic">
                 "{cvData.personalInfo.summary}"
              </p>
           </div>

           <hr className="border-t border-gray-200 w-1/2 mx-auto" />

           {/* Experience */}
           <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 text-center">
                 Work Experience
              </h2>
              <div className="space-y-8">
                 {cvData.experience.map((exp) => (
                   <div key={exp.id} className="grid grid-cols-4 gap-4">
                      <div className="col-span-1 text-right">
                         <span className="text-sm font-medium text-gray-500 block">
                            {formatDate(exp.startDate)} — 
                         </span>
                         <span className="text-sm font-medium text-gray-500 block">
                            {exp.current ? 'Present' : formatDate(exp.endDate)}
                         </span>
                      </div>
                      <div className="col-span-3 border-l border-gray-200 pl-6 pb-2">
                         <h3 className="text-lg font-medium text-gray-900">{exp.position}</h3>
                         <div className="text-sm text-gray-500 mb-2">{exp.company}, {exp.location}</div>
                         <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {exp.description}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Education */}
           <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 text-center mt-8">
                 Education
              </h2>
              <div className="grid grid-cols-2 gap-8">
                 {cvData.education.map((edu) => (
                   <div key={edu.id} className="text-center">
                      <h3 className="text-md font-medium text-gray-900">{edu.degree}</h3>
                      <p className="text-sm text-gray-500">{edu.institution}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Skills */}
           <div className="text-center">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
                 Expertise
              </h2>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                 {cvData.skills.map((skill, index) => (
                   <span key={index} className="text-sm text-gray-600">
                      {skill}
                   </span>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* ================= EXECUTIVE TEMPLATE ================= */}
      {template === 'executive' && (
        <div className="font-serif">
           {/* Sidebar Layout */}
           <div className="grid grid-cols-12 min-h-[1000px]">
              {/* Left Sidebar */}
              <div className="col-span-4 bg-[#2c3e50] text-gray-100 p-8 -my-12 -ml-12 text-sm">
                 <div className="mb-8 text-center">
                    {cvData.personalInfo.profilePhoto && (
                      <img 
                        src={cvData.personalInfo.profilePhoto} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-400 mx-auto mb-4"
                      />
                    )}
                 </div>
                 
                 <div className="space-y-8">
                    <div>
                       <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4 border-b border-gray-600 pb-2">Contact</h3>
                       <div className="space-y-3">
                          <div className="flex items-center gap-3">
                             <Mail className="w-4 h-4" />
                             <span className="break-all">{cvData.personalInfo.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <Phone className="w-4 h-4" />
                             <span>{cvData.personalInfo.phone}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <MapPin className="w-4 h-4" />
                             <span>{cvData.personalInfo.location}</span>
                          </div>
                          {cvData.personalInfo.linkedinUrl && (
                            <div className="flex items-center gap-3">
                               <Linkedin className="w-4 h-4" />
                               <span className="break-all">{cvData.personalInfo.linkedinUrl}</span>
                            </div>
                          )}
                       </div>
                    </div>

                    <div>
                       <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4 border-b border-gray-600 pb-2">Education</h3>
                       <div className="space-y-4">
                          {cvData.education.map((edu) => (
                            <div key={edu.id}>
                               <div className="font-bold text-white">{edu.degree}</div>
                               <div className="text-gray-300">{edu.institution}</div>
                               <div className="text-xs text-gray-400 mt-1">
                                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div>
                       <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4 border-b border-gray-600 pb-2">Skills</h3>
                       <div className="flex flex-wrap gap-2">
                          {cvData.skills.map((skill, index) => (
                            <span key={index} className="bg-[#34495e] px-2 py-1 rounded text-xs text-gray-200">
                               {skill}
                            </span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Content */}
              <div className="col-span-8 p-8 -my-12 -mr-12 bg-white">
                 <div className="border-b-2 border-[#2c3e50] pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-[#2c3e50] mb-2 uppercase tracking-tight">
                       {cvData.personalInfo.fullName}
                    </h1>
                    <p className="text-xl text-gray-600 italic">
                       {cvData.personalInfo.title}
                    </p>
                 </div>

                 <div className="mb-8">
                    <h2 className="text-lg font-bold text-[#2c3e50] uppercase tracking-wide mb-4 flex items-center gap-2">
                       Professional Profile
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-justify">
                       {cvData.personalInfo.summary}
                    </p>
                 </div>

                 <div>
                    <h2 className="text-lg font-bold text-[#2c3e50] uppercase tracking-wide mb-6 flex items-center gap-2">
                       Experience
                    </h2>
                    <div className="space-y-6">
                       {cvData.experience.map((exp) => (
                         <div key={exp.id}>
                            <div className="flex justify-between items-baseline mb-1">
                               <h3 className="text-xl font-bold text-gray-800">{exp.position}</h3>
                               <span className="text-sm font-bold text-[#2c3e50]">
                                  {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                               </span>
                            </div>
                            <div className="text-md font-semibold text-gray-600 mb-2 italic">
                               {exp.company} | {exp.location}
                            </div>
                            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line pl-4 border-l-2 border-gray-200">
                               {exp.description}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ================= TECH PRO TEMPLATE ================= */}
      {template === 'tech' && (
        <div className="font-mono text-sm space-y-8 bg-[#f8f9fa] -m-12 p-12 min-h-[1400px]">
           {/* Header - Terminal Style */}
           <div className="bg-[#1e1e1e] text-green-400 p-6 rounded-lg shadow-lg border-l-4 border-green-500">
              <div className="mb-4 text-xs opacity-50">$ init_profile --user="{cvData.personalInfo.fullName}"</div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">
                 {'>'} {cvData.personalInfo.fullName}<span className="animate-pulse">_</span>
              </h1>
              <p className="text-xl text-green-500 mb-6 font-bold">
                 // {cvData.personalInfo.title}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-gray-300 text-xs">
                 <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-500" /> {cvData.personalInfo.email}
                 </div>
                 <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" /> {cvData.personalInfo.phone}
                 </div>
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" /> {cvData.personalInfo.location}
                 </div>
                 {cvData.personalInfo.linkedinUrl && (
                    <div className="flex items-center gap-2">
                       <Linkedin className="w-4 h-4 text-green-500" /> {cvData.personalInfo.linkedinUrl}
                    </div>
                 )}
              </div>
           </div>

           {/* Skills - Tags */}
           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-[#1e1e1e] mb-4 border-b border-gray-200 pb-2">
                 const stack = [...]
              </h2>
              <div className="flex flex-wrap gap-2">
                 {cvData.skills.map((skill, index) => (
                   <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded text-xs font-semibold">
                      "{skill}"
                   </span>
                 ))}
              </div>
           </div>

           {/* Experience */}
           <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#1e1e1e] border-b-2 border-green-500 pb-1 w-fit">
                 git log --experience
              </h2>
              {cvData.experience.map((exp, index) => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-gray-300 hover:border-green-500 transition-colors">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-400"></div>
                   <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-[#1e1e1e]">{exp.position}</h3>
                      <span className="text-xs font-mono bg-[#1e1e1e] text-green-400 px-2 py-1 rounded">
                         {formatDate(exp.startDate)} :: {exp.current ? 'HEAD' : formatDate(exp.endDate)}
                      </span>
                   </div>
                   <div className="text-green-700 font-bold mb-2">@ {exp.company}</div>
                   <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {exp.description}
                   </div>
                </div>
              ))}
           </div>

           {/* Education */}
           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-[#1e1e1e] mb-4 border-b border-gray-200 pb-2">
                 class Education {'{'}
              </h2>
              <div className="space-y-4 pl-4">
                 {cvData.education.map((edu) => (
                   <div key={edu.id}>
                      <span className="text-purple-600">this</span>.degree = <span className="text-blue-600">"{edu.degree}"</span>;
                      <br/>
                      <span className="text-purple-600">this</span>.institution = <span className="text-blue-600">"{edu.institution}"</span>;
                      <br/>
                      <span className="text-gray-400 text-xs">// {formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                   </div>
                 ))}
                 <div>{'}'}</div>
              </div>
           </div>
        </div>
      )}

    </Card>
  );
};

export default CVPreview;
