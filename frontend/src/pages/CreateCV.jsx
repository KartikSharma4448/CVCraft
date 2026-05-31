import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileText, Sparkles, Download, Plus, Trash2, ArrowLeft, Upload, X } from 'lucide-react';
import { mockLinkedInData } from '../mock/mockData';
import api from '../lib/api';
import { refineText, compilePDF } from '../lib/api';
import CVPreview from '../components/CVPreview';
import { toast } from '../hooks/use-toast';
import ATSScorePanel from '../components/ATSScorePanel';
import AIToggle from '../components/AIToggle';
import TemplateSelector from '../components/TemplateSelector';
import { trackEvent } from '../lib/analytics';
import SEOHead from '../components/SEOHead';

const CreateCV = () => {
  const navigate = useNavigate();
  const [cvData, setCvData] = useState(mockLinkedInData);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [atsScoreValue, setAtsScoreValue] = useState(null);

  const [activeTab, setActiveTab] = useState('personal');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [refinedSections, setRefinedSections] = useState(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePersonalInfoChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Read file and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePersonalInfoChange('profilePhoto', reader.result);
        toast({
          title: "Image Uploaded",
          description: "Profile photo added successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = () => {
    handlePersonalInfoChange('profilePhoto', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Image Removed",
      description: "Profile photo removed successfully",
    });
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: ''
    };
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const updateEducation = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addSkill = () => {
    const newSkill = prompt('Enter skill name:');
    if (newSkill && newSkill.trim()) {
      setCvData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
    }
  };

  const removeSkill = (index) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleAIOptimize = async () => {
    if (!aiEnabled) {
      toast({ title: 'AI Disabled', description: 'Enable AI Refinement to use this feature', variant: 'destructive' });
      return;
    }
    try {
      setAiLoading(true);
      // Build a prompt combining summary and experiences
      const summary = cvData.personalInfo.summary || '';
      const expText = (cvData.experience || []).map(e => `Position: ${e.position} at ${e.company}. Description: ${e.description}`).join('\n');
      const prompt = `Improve and polish this resume summary and achievements for ATS and recruiter readability. Return a concise improved professional summary and bullet achievements.\n\nSummary:\n${summary}\n\nExperience:\n${expText}`;

      const genResp = await api.generateText(prompt, 300);
      // Try to extract text from common response shapes
      let generated = '';
      if (genResp.output_text) generated = genResp.output_text;
      else if (genResp.outputs && genResp.outputs[0] && genResp.outputs[0].content) {
        const c = genResp.outputs[0].content;
        if (typeof c === 'string') generated = c;
        else if (c.text) generated = c.text;
      } else if (genResp.choices && genResp.choices[0] && genResp.choices[0].text) generated = genResp.choices[0].text;
      else generated = JSON.stringify(genResp);

      setAiSuggestion(generated);
      setShowAISuggestions(true);

      // Compute ATS score
      const cvPlain = `${summary}\n${expText}\n${(cvData.skills||[]).join(', ')}`;
      const atsResp = await api.atsScore(cvPlain, '');
      if (atsResp && typeof atsResp.ats_score !== 'undefined') {
        setAtsScoreValue(atsResp.ats_score);
        toast({ title: 'AI Analysis Complete', description: `Your CV has an ATS score of ${atsResp.ats_score}/100` });
      } else {
        toast({ title: 'AI Analysis', description: 'Analysis complete' });
      }
    } catch (err) {
      console.error('AI optimize error', err);
      toast({ title: 'AI Failed', description: 'Could not reach AI services', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    // Naively replace professional summary with AI suggestion's first paragraph
    if (!aiSuggestion) return;
    const first = aiSuggestion.split('\n\n')[0];
    handlePersonalInfoChange('summary', first);
    toast({ title: 'Applied', description: 'AI suggestion applied to Professional Summary' });
    setShowAISuggestions(false);
  };

  /**
   * Offer to refine a text entry using the AI refinement endpoint.
   * Only calls the API when aiEnabled is true and the section hasn't been refined yet.
   */
  const handleRefineSection = async (text, section, sectionKey) => {
    if (!aiEnabled) return;
    if (!text || !text.trim()) return;
    if (refinedSections.has(sectionKey)) return;

    try {
      const result = await refineText(text, section);
      if (!result.is_error && result.refined_text !== text) {
        setRefinedSections(prev => new Set([...prev, sectionKey]));
        return result.refined_text;
      }
    } catch (err) {
      console.error('Refine error:', err);
    }
    return null;
  };

  /**
   * When AI toggle is enabled, offer to refine unprocessed text entries.
   */
  const handleAIToggle = async (enabled) => {
    setAiEnabled(enabled);
    if (enabled) {
      // Offer to refine unprocessed text entries
      const summary = cvData.personalInfo.summary;
      if (summary && summary.trim() && !refinedSections.has('summary')) {
        const refined = await handleRefineSection(summary, 'summary', 'summary');
        if (refined) {
          const apply = window.confirm('AI has a suggestion for your Professional Summary. Apply it?');
          if (apply) {
            handlePersonalInfoChange('summary', refined);
            toast({ title: 'Refined', description: 'Professional Summary refined by AI' });
          }
        }
      }
    }
  };

  /**
   * Download PDF — tries server-side compilation first, falls back to client-side jsPDF.
   * Client-side fallback generates a professional ATS-optimized PDF matching the
   * Jake Ryan LaTeX resume format: centered name, contact pipes, section underlines,
   * two-column date/location layout, and bullet points.
   * Fires GA4 pdf_generated event on success.
   */
  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      toast({
        title: "Generating PDF",
        description: "Compiling your CV...",
      });

      let blob;
      let usedFallback = false;

      // Try server-side compilation first
      try {
        blob = await compilePDF(cvData, selectedTemplate);
      } catch (serverErr) {
        // Server-side failed — use client-side jsPDF with ATS format
        console.warn('Server PDF failed, using client-side fallback:', serverErr.message);
        usedFallback = true;

        const { jsPDF } = await import('jspdf');
        // A4 paper for clean template, Letter for modern
        const paperSize = selectedTemplate === 'clean' ? 'a4' : 'letter';
        const pdf = new jsPDF('p', 'mm', paperSize);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginLeft = selectedTemplate === 'clean' ? 19 : 12.7;
        const marginRight = selectedTemplate === 'clean' ? 19 : 12.7;
        const marginTop = selectedTemplate === 'clean' ? 19 : 12.7;
        const marginBottom = selectedTemplate === 'clean' ? 19 : 12.7;
        const contentWidth = pageWidth - marginLeft - marginRight;
        let y = marginTop;

        // --- Utility helpers ---
        const checkPageBreak = (needed) => {
          if (y + needed > pageHeight - marginBottom) {
            pdf.addPage();
            y = marginTop;
          }
        };

        // Draw text right-aligned
        const textRight = (text, yPos) => {
          const w = pdf.getTextWidth(text);
          pdf.text(text, pageWidth - marginRight - w, yPos);
        };

        // Draw a section header with underline (matches \titleformat{\section})
        const sectionHeader = (title) => {
          checkPageBreak(10);
          y += 3;
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(title.toUpperCase(), marginLeft, y);
          y += 1.5;
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.4);
          pdf.line(marginLeft, y, pageWidth - marginRight, y);
          y += 4;
        };

        // Draw a bullet point item with word wrap
        const bulletItem = (text, indent = 4) => {
          if (!text || !text.trim()) return;
          pdf.setFontSize(9.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const bulletX = marginLeft + indent;
          const textX = bulletX + 3;
          const maxW = contentWidth - indent - 3;
          const lines = pdf.splitTextToSize(text.trim(), maxW);
          checkPageBreak(lines.length * 3.8 + 1);
          // Bullet character
          pdf.text('\u2022', bulletX, y);
          pdf.text(lines, textX, y);
          y += lines.length * 3.8 + 0.5;
        };

        // ============================================================
        // TEMPLATE BRANCHING
        // ============================================================

        // Date formatter
        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          const [year, month] = dateStr.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[parseInt(month) - 1]} ${year}`;
        };

        if (selectedTemplate === 'clean') {
          // ---- CLEAN TEMPLATE (cv_template.tex style) ----
          // A4, 0.75in margins, serif-like feel, single-line headers

          // HEADING
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          const name = (cvData.personalInfo.fullName || 'Your Name').toUpperCase();
          const nameWidth = pdf.getTextWidth(name);
          pdf.text(name, (pageWidth - nameWidth) / 2, y);
          y += 6;

          // Contact line 1: location | phone | email
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          const contact1 = [cvData.personalInfo.location, cvData.personalInfo.phone, cvData.personalInfo.email].filter(Boolean).join('  |  ');
          if (contact1) {
            const c1w = pdf.getTextWidth(contact1);
            pdf.text(contact1, (pageWidth - c1w) / 2, y);
            y += 4;
          }
          // Contact line 2: portfolio | linkedin | github
          const contact2 = [cvData.personalInfo.portfolio, cvData.personalInfo.linkedinUrl].filter(Boolean).join('  |  ');
          if (contact2) {
            const c2w = pdf.getTextWidth(contact2);
            pdf.text(contact2, (pageWidth - c2w) / 2, y);
            y += 4;
          }

          // SUMMARY
          if (cvData.personalInfo.summary && cvData.personalInfo.summary.trim()) {
            sectionHeader('Summary');
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(cvData.personalInfo.summary.trim(), contentWidth);
            checkPageBreak(lines.length * 4);
            pdf.text(lines, marginLeft, y);
            y += lines.length * 4 + 2;
          }

          // SKILLS (bullet list with bold categories)
          if (cvData.skills && cvData.skills.length > 0) {
            sectionHeader('Technical Skills');
            pdf.setFontSize(10);
            for (const skill of cvData.skills) {
              checkPageBreak(5);
              const colonIdx = skill.indexOf(':');
              if (colonIdx > -1) {
                pdf.setFont('helvetica', 'bold');
                const cat = skill.substring(0, colonIdx + 1);
                pdf.text('\u2022  ', marginLeft + 2, y);
                pdf.text(cat, marginLeft + 6, y);
                const catW = pdf.getTextWidth(cat + ' ');
                pdf.setFont('helvetica', 'normal');
                const val = skill.substring(colonIdx + 1).trim();
                const valLines = pdf.splitTextToSize(val, contentWidth - 6 - catW);
                pdf.text(valLines[0] || '', marginLeft + 6 + catW, y);
                y += 4.2;
                for (let i = 1; i < valLines.length; i++) {
                  checkPageBreak(4);
                  pdf.text(valLines[i], marginLeft + 6 + catW, y);
                  y += 4;
                }
              } else {
                pdf.setFont('helvetica', 'normal');
                pdf.text('\u2022  ' + skill, marginLeft + 2, y);
                y += 4.2;
              }
            }
            y += 1;
          }

          // EXPERIENCE
          if (cvData.experience && cvData.experience.length > 0) {
            sectionHeader('Experience');
            for (const exp of cvData.experience) {
              checkPageBreak(16);
              // Bold position left, italic dates right
              pdf.setFontSize(10.5);
              pdf.setFont('helvetica', 'bold');
              pdf.text(exp.position || '', marginLeft, y);
              pdf.setFont('helvetica', 'italic');
              pdf.setFontSize(9.5);
              const dateStr = [formatDate(exp.startDate), exp.current ? 'Present' : formatDate(exp.endDate)].filter(Boolean).join(' – ');
              textRight(dateStr, y);
              y += 4.2;
              // Italic company, location
              pdf.setFont('helvetica', 'italic');
              pdf.setFontSize(9.5);
              pdf.text([exp.company, exp.location].filter(Boolean).join(', '), marginLeft, y);
              y += 4.5;
              // Bullets
              if (exp.description) {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9.5);
                const bullets = exp.description.split('\n').filter(b => b.trim());
                for (const b of bullets) {
                  const clean = b.replace(/^[\s\-•◦⁃*]+/, '').trim();
                  if (clean) bulletItem(clean, 2);
                }
              }
              y += 3;
            }
          }

          // EDUCATION
          if (cvData.education && cvData.education.length > 0) {
            sectionHeader('Education');
            for (const edu of cvData.education) {
              checkPageBreak(12);
              pdf.setFontSize(10.5);
              pdf.setFont('helvetica', 'bold');
              const degLine = [edu.degree, edu.field].filter(Boolean).join(' in ') || edu.institution;
              pdf.text(degLine, marginLeft, y);
              pdf.setFont('helvetica', 'italic');
              pdf.setFontSize(9.5);
              const eduDate = [formatDate(edu.startDate), formatDate(edu.endDate)].filter(Boolean).join(' – ');
              textRight(eduDate, y);
              y += 4.2;
              if (edu.degree) {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9.5);
                pdf.text(edu.institution || '', marginLeft, y);
                y += 4;
              }
              if (edu.gpa) {
                pdf.text('GPA: ' + edu.gpa, marginLeft, y);
                y += 4;
              }
              y += 2;
            }
          }

        } else {
        // ============================================================
        // MODERN TEMPLATE (Jake Ryan style) — default
        // ============================================================

        // HEADING — Centered name, contact line with pipes
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        const name = cvData.personalInfo.fullName || 'Your Name';
        const nameWidth = pdf.getTextWidth(name);
        pdf.text(name, (pageWidth - nameWidth) / 2, y);
        y += 7;

        // Contact info line — centered, separated by |
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const contactItems = [
          cvData.personalInfo.phone,
          cvData.personalInfo.email,
          cvData.personalInfo.portfolio,
          cvData.personalInfo.linkedinUrl,
        ].filter(Boolean);
        if (contactItems.length) {
          const contactLine = contactItems.join('  |  ');
          const contactW = pdf.getTextWidth(contactLine);
          pdf.text(contactLine, (pageWidth - contactW) / 2, y);
          y += 4;
        }
        // Location line if present
        if (cvData.personalInfo.location) {
          const locW = pdf.getTextWidth(cvData.personalInfo.location);
          pdf.text(cvData.personalInfo.location, (pageWidth - locW) / 2, y);
          y += 3;
        }

        // ============================================================
        // PROFESSIONAL SUMMARY
        // ============================================================
        if (cvData.personalInfo.summary && cvData.personalInfo.summary.trim()) {
          sectionHeader('Professional Summary');
          pdf.setFontSize(9.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const summaryLines = pdf.splitTextToSize(cvData.personalInfo.summary.trim(), contentWidth);
          checkPageBreak(summaryLines.length * 3.8);
          pdf.text(summaryLines, marginLeft, y);
          y += summaryLines.length * 3.8 + 2;
        }

        // ============================================================
        // TECHNICAL SKILLS — category: values format
        // ============================================================
        if (cvData.skills && cvData.skills.length > 0) {
          sectionHeader('Technical Skills');
          pdf.setFontSize(9.5);

          // Try to group skills by category if they contain colons (e.g. "Languages: Python, JS")
          // Otherwise render as a single "Skills:" line
          const isGrouped = cvData.skills.some(s => s.includes(':'));
          if (isGrouped) {
            // Skills are already in "Category: value1, value2" format
            for (const skillLine of cvData.skills) {
              checkPageBreak(5);
              const colonIdx = skillLine.indexOf(':');
              if (colonIdx > -1) {
                const category = skillLine.substring(0, colonIdx + 1);
                const values = skillLine.substring(colonIdx + 1).trim();
                pdf.setFont('helvetica', 'bold');
                pdf.text(category, marginLeft + 2, y);
                const catW = pdf.getTextWidth(category + ' ');
                pdf.setFont('helvetica', 'normal');
                const valLines = pdf.splitTextToSize(values, contentWidth - 2 - catW);
                pdf.text(valLines[0] || '', marginLeft + 2 + catW, y);
                if (valLines.length > 1) {
                  for (let i = 1; i < valLines.length; i++) {
                    y += 3.8;
                    checkPageBreak(4);
                    pdf.text(valLines[i], marginLeft + 2 + catW, y);
                  }
                }
                y += 4.2;
              } else {
                pdf.setFont('helvetica', 'normal');
                const lines = pdf.splitTextToSize(skillLine, contentWidth - 2);
                pdf.text(lines, marginLeft + 2, y);
                y += lines.length * 3.8 + 1;
              }
            }
          } else {
            // Flat array of skills — render as "Skills: skill1, skill2, ..."
            pdf.setFont('helvetica', 'bold');
            const label = 'Skills: ';
            pdf.text(label, marginLeft + 2, y);
            const labelW = pdf.getTextWidth(label);
            pdf.setFont('helvetica', 'normal');
            const skillsStr = cvData.skills.join(', ');
            const skillLines = pdf.splitTextToSize(skillsStr, contentWidth - 2 - labelW);
            pdf.text(skillLines[0] || '', marginLeft + 2 + labelW, y);
            if (skillLines.length > 1) {
              for (let i = 1; i < skillLines.length; i++) {
                y += 3.8;
                checkPageBreak(4);
                pdf.text(skillLines[i], marginLeft + 2 + labelW, y);
              }
            }
            y += 4.2;
          }
          y += 1;
        }

        // ============================================================
        // WORK EXPERIENCE
        // ============================================================
        if (cvData.experience && cvData.experience.length > 0) {
          sectionHeader('Work Experience');

          for (const exp of cvData.experience) {
            checkPageBreak(18);

            // Line 1: Company/Org bold left, Dates right
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            const companyName = exp.company || '';
            pdf.text(companyName, marginLeft + 2, y);

            const dateStr = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' -- ');
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9.5);
            textRight(dateStr, y);
            y += 4.2;

            // Line 2: Position italic left, Location italic right
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9.5);
            pdf.text(exp.position || '', marginLeft + 2, y);

            if (exp.location) {
              const savedFont = pdf.getFont();
              pdf.setFont('helvetica', 'italic');
              textRight(exp.location, y);
              pdf.setFont(savedFont.fontName, savedFont.fontStyle);
            }
            y += 4.5;

            // Bullet points from description (split by newlines)
            if (exp.description) {
              const bullets = exp.description.split('\n').filter(b => b.trim());
              for (const bullet of bullets) {
                // Strip leading bullet chars/dashes if present
                const cleanBullet = bullet.replace(/^[\s\-\u2022\u2023\u25E6\u2043*]+/, '').trim();
                if (cleanBullet) {
                  bulletItem(cleanBullet, 4);
                }
              }
            }
            y += 2;
          }
        }

        // ============================================================
        // EDUCATION
        // ============================================================
        if (cvData.education && cvData.education.length > 0) {
          sectionHeader('Education');

          for (const edu of cvData.education) {
            checkPageBreak(14);

            // Line 1: Degree bold left, Dates right
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            const degreeLine = [edu.degree, edu.field].filter(Boolean).join(' in ');
            pdf.text(degreeLine || edu.institution || '', marginLeft + 2, y);

            const eduDateStr = [edu.startDate, edu.endDate].filter(Boolean).join(' -- ');
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9.5);
            textRight(eduDateStr, y);
            y += 4.2;

            // Line 2: Institution italic left, Location italic right (if available)
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9.5);
            if (degreeLine) {
              pdf.text(edu.institution || '', marginLeft + 2, y);
            }
            y += 4.5;

            // GPA as bullet if present
            if (edu.gpa) {
              bulletItem(`GPA: ${edu.gpa}`, 4);
            }
            y += 1.5;
          }
        }

        // ============================================================
        // PROJECTS (if cvData has projects array)
        // ============================================================
        if (cvData.projects && cvData.projects.length > 0) {
          sectionHeader('Projects');

          for (const proj of cvData.projects) {
            checkPageBreak(12);

            // Project name bold + tech stack in italic
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            const projName = proj.name || proj.title || '';
            let projHeader = projName;
            pdf.text(projHeader, marginLeft + 2, y);

            // Tech stack in italic gray after the name
            if (proj.techStack || proj.technologies) {
              const tech = proj.techStack || proj.technologies;
              const techStr = Array.isArray(tech) ? tech.join(', ') : tech;
              const nameW = pdf.getTextWidth(projName + '  |  ');
              pdf.setFont('helvetica', 'italic');
              pdf.setTextColor(80, 80, 80);
              pdf.setFontSize(9.5);
              pdf.text(techStr, marginLeft + 2 + nameW, y);
            }

            // Date right-aligned if present
            if (proj.date || proj.dates) {
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(9.5);
              textRight(proj.date || proj.dates || '', y);
            }
            y += 4.5;

            // Description bullets
            pdf.setTextColor(0, 0, 0);
            const projDesc = proj.description || '';
            if (projDesc) {
              const bullets = projDesc.split('\n').filter(b => b.trim());
              for (const bullet of bullets) {
                const cleanBullet = bullet.replace(/^[\s\-\u2022\u2023\u25E6\u2043*]+/, '').trim();
                if (cleanBullet) {
                  bulletItem(cleanBullet, 4);
                }
              }
            }
            y += 2;
          }
        }

        } // end else (modern template)

        blob = pdf.output('blob');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(cvData.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Fire GA4 event on successful PDF download
      trackEvent('pdf_generated', { template: selectedTemplate, method: usedFallback ? 'client' : 'server' });

      toast({
        title: "Success!",
        description: "Your CV has been downloaded as PDF",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPdfLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <SEOHead
        title="Create Your CV - CVCraft"
        description="Build a professional, ATS-optimized resume with AI-powered suggestions. Choose from 6 templates and export as PDF."
        path="/create"
      />
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0b]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#0066ff]" />
                <span className="text-xl font-bold text-white">CVCraft</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AIToggle enabled={aiEnabled} onToggle={handleAIToggle} />
              <Button 
                onClick={handleAIOptimize}
                variant="outline"
                className="border-[#0066ff] text-[#0066ff] hover:bg-[#0066ff]/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {aiLoading ? 'Analyzing...' : 'AI Optimize'}
              </Button>

              <Button 
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            {showAISuggestions && (
              <Card className="bg-[#081018] border-blue-800 p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-semibold">AI Suggestion</h4>
                    {atsScoreValue !== null && (
                      <p className="text-sm text-gray-300">ATS Score: {atsScoreValue}/100</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAISuggestions(false)} variant="ghost">Close</Button>
                    <Button onClick={applyAISuggestion} className="bg-[#0066ff] text-white">Apply</Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-200 mt-3">{aiSuggestion}</pre>
              </Card>
            )}
            <Card className="bg-[#1a1a1c] border-gray-800 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-[#0f0f10]">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-4 mt-6">
                  {/* Profile Photo Upload */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Profile Photo</Label>
                    <div className="flex items-center gap-4">
                      {cvData.personalInfo.profilePhoto ? (
                        <div className="relative">
                          <img 
                            src={cvData.personalInfo.profilePhoto} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-[#0066ff]"
                          />
                          <button
                            onClick={removeProfilePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-[#0f0f10] border-2 border-dashed border-gray-700 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload">
                          <Button 
                            type="button"
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:text-white hover:border-[#0066ff] cursor-pointer"
                            onClick={() => document.getElementById('photo-upload').click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {cvData.personalInfo.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Recommended: Square image, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Full Name</Label>
                    <Input 
                      value={cvData.personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Email</Label>
                      <Input 
                        type="email"
                        value={cvData.personalInfo.email}
                        onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Phone</Label>
                      <Input 
                        value={cvData.personalInfo.phone}
                        onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Location</Label>
                    <Input 
                      value={cvData.personalInfo.location}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">LinkedIn URL</Label>
                      <Input 
                        value={cvData.personalInfo.linkedinUrl}
                        onChange={(e) => handlePersonalInfoChange('linkedinUrl', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Portfolio/Website</Label>
                      <Input 
                        value={cvData.personalInfo.portfolio}
                        onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Professional Title</Label>
                    <Input 
                      value={cvData.personalInfo.title}
                      onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Professional Summary</Label>
                    <Textarea 
                      value={cvData.personalInfo.summary}
                      onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                      rows={6}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-4 mt-6">
                  {cvData.experience.map((exp, index) => (
                    <Card key={exp.id} className="bg-[#0f0f10] border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-semibold">Experience {index + 1}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Position</Label>
                          <Input 
                            value={exp.position}
                            onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Company</Label>
                          <Input 
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Location</Label>
                          <Input 
                            value={exp.location}
                            onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">Start Date</Label>
                            <Input 
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">End Date</Label>
                            <Input 
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              disabled={exp.current}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <Label className="text-gray-400 text-sm">Currently working here</Label>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Description</Label>
                          <Textarea 
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            rows={4}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                            placeholder="• Achievement 1\n• Achievement 2\n• Achievement 3"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button 
                    onClick={addExperience}
                    variant="outline"
                    className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-[#0066ff]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4 mt-6">
                  {cvData.education.map((edu, index) => (
                    <Card key={edu.id} className="bg-[#0f0f10] border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-semibold">Education {index + 1}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Institution</Label>
                          <Input 
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Degree</Label>
                          <Input 
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Field of Study</Label>
                          <Input 
                            value={edu.field}
                            onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">Start Date</Label>
                            <Input 
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">End Date</Label>
                            <Input 
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">GPA (Optional)</Label>
                          <Input 
                            value={edu.gpa}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                            placeholder="3.8"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button 
                    onClick={addEducation}
                    variant="outline"
                    className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-[#0066ff]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-gray-300 mb-3 block">Your Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cvData.skills.map((skill, index) => (
                        <div 
                          key={index}
                          className="bg-[#0066ff]/10 border border-[#0066ff]/30 px-3 py-1.5 rounded-full flex items-center gap-2"
                        >
                          <span className="text-sm text-[#0066ff]">{skill}</span>
                          <button 
                            onClick={() => removeSkill(index)}
                            className="text-[#0066ff] hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={addSkill}
                      variant="outline"
                      className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-[#0066ff]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Template Selection */}
            <Card className="bg-[#1a1a1c] border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-4">Choose Template</h3>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </Card>
            <div className="mt-6">
              <ATSScorePanel cvText={`${cvData.personalInfo.summary || ''}\n${(cvData.experience||[]).map(e=>e.description).join('\n')}`} />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="cv-preview-content">
              <CVPreview cvData={cvData} template={selectedTemplate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCV;
