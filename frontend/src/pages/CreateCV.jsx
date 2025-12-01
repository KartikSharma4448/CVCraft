import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileText, Sparkles, Download, Plus, Trash2, ArrowLeft, Check, Upload, X } from 'lucide-react';
import { mockLinkedInData, mockTemplates, mockAISuggestions } from '../mock/mockData';
import CVPreview from '../components/CVPreview';
import { toast } from '../hooks/use-toast';

const CreateCV = () => {
  const navigate = useNavigate();
  const [cvData, setCvData] = useState(mockLinkedInData);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
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

  const handleAIOptimize = () => {
    setShowAISuggestions(true);
    toast({
      title: "AI Analysis Complete",
      description: `Your CV has an ATS score of ${mockAISuggestions.atsScore}/100`,
    });
  };

  const handleExportPDF = async () => {
    try {
      toast({
        title: "Exporting CV",
        description: "Your CV is being prepared for download...",
      });

      // Dynamically import libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Get the CV preview element
      const cvElement = document.querySelector('.cv-preview-content');
      
      if (!cvElement) {
        throw new Error('CV preview element not found');
      }

      // Generate canvas from CV preview
      const canvas = await html2canvas(cvElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate PDF dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      const fileName = `${cvData.personalInfo.fullName.replace(/\s+/g, '_')}_CV.pdf`;
      pdf.save(fileName);

      toast({
        title: "Success!",
        description: "Your CV has been downloaded as PDF",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your CV. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
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
              <Button 
                onClick={handleAIOptimize}
                variant="outline"
                className="border-[#0066ff] text-[#0066ff] hover:bg-[#0066ff]/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Optimize
              </Button>
              <Button 
                onClick={handleExportPDF}
                className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
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

            {/* AI Suggestions */}
            {showAISuggestions && (
              <Card className="bg-[#1a1a1c] border-[#0066ff]/30 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-[#0066ff] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">AI Suggestions</h3>
                    <p className="text-gray-400 text-sm mb-4">{mockAISuggestions.summary}</p>
                    <div className="space-y-3">
                      {mockAISuggestions.improvements.map((item, index) => (
                        <div key={index} className="bg-[#0f0f10] border border-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-white mb-1">{item.section}</div>
                              <div className="text-sm text-gray-400">{item.suggestion}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.priority === 'high' ? 'bg-red-400/10 text-red-400' :
                              item.priority === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                              'bg-blue-400/10 text-blue-400'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-[#0066ff]/10 border border-[#0066ff]/30 rounded-lg">
                      <div className="text-sm text-gray-300 mb-2">ATS Compatibility Score</div>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-bold text-[#0066ff]">{mockAISuggestions.atsScore}/100</div>
                        <div className="flex-1">
                          <div className="h-2 bg-[#0f0f10] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#0066ff]"
                              style={{ width: `${mockAISuggestions.atsScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Template Selection */}
            <Card className="bg-[#1a1a1c] border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-4">Choose Template</h3>
              <div className="grid grid-cols-3 gap-4">
                {mockTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedTemplate === template.id 
                        ? 'border-[#0066ff] scale-105' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-full h-32 object-cover"
                    />
                    {selectedTemplate === template.id && (
                      <div className="absolute inset-0 bg-[#0066ff]/20 flex items-center justify-center">
                        <div className="bg-[#0066ff] rounded-full p-2">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="bg-[#0f0f10] p-2">
                      <div className="text-white text-sm font-medium">{template.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
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
