// frontend/src/components/RegistrationManagementPage.jsx
// Simple but Creative Registration Management Page Design

import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { 
  FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';
import {
  getSettings, getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear,
  addSection, updateSection, deleteSection, addYearLevel, updateYearLevel, deleteYearLevel,
  addDepartment, updateDepartment, deleteDepartment, toggleAcademicYearStatus
} from '../api/api';
import './RegistrationManagementPage.css';

function RegistrationManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('academic-years');

  // Academic Years Management
  const [academicYears, setAcademicYears] = useState([]);
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] = useState(null);
  const [academicYearForm, setAcademicYearForm] = useState({
    year: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  // Sections Management
  const [sections, setSections] = useState([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name: '' });
  const [savingSection, setSavingSection] = useState(false);

  // Year Levels Management
  const [yearLevels, setYearLevels] = useState([]);
  const [showYearLevelModal, setShowYearLevelModal] = useState(false);
  const [editingYearLevel, setEditingYearLevel] = useState(null);
  const [yearLevelForm, setYearLevelForm] = useState({ name: '' });
  const [savingYearLevel, setSavingYearLevel] = useState(false);

  // Departments Management
  const [departments, setDepartments] = useState([]);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({ name: '' });
  const [savingDepartment, setSavingDepartment] = useState(false);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Check authentication status on component mount
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      setError('You are not logged in. Please log in to access this page.');
      setLoading(false);
      return;
    }
    
    if (role !== 'Admin') {
      setError('Access denied. Only administrators can access this page.');
      setLoading(false);
      return;
    }
    
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, academicYearsData] = await Promise.all([
        getSettings(),
        getAcademicYears()
      ]);
      
      // Check and auto-deactivate expired academic years
      const updatedAcademicYears = await checkAndUpdateExpiredAcademicYears(academicYearsData || []);
      
      setAcademicYears(updatedAcademicYears);
      setSections(settingsData.sections || []);
      setYearLevels(settingsData.yearLevels || []);
      setDepartments(settingsData.departments || []);
      setError('');
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError(`Failed to fetch registration settings: ${err.message}`);
    }
    setLoading(false);
  };

  // Academic Years Management
  const handleAddAcademicYear = () => {
    setEditingAcademicYear(null);
    setAcademicYearForm({
      year: '',
      description: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setShowAcademicYearModal(true);
  };

  const handleEditAcademicYear = (academicYear) => {
    setEditingAcademicYear(academicYear);
    setAcademicYearForm({
      year: academicYear.year || academicYear.name,
      description: academicYear.description || '',
      startDate: academicYear.startDate ? new Date(academicYear.startDate).toISOString().split('T')[0] : '',
      endDate: academicYear.endDate ? new Date(academicYear.endDate).toISOString().split('T')[0] : '',
      isActive: academicYear.isActive
    });
    setShowAcademicYearModal(true);
  };

  const handleSaveAcademicYear = async () => {
    if (!academicYearForm.year) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Academic year is required.' });
      return;
    }

    try {
      if (editingAcademicYear) {
        await updateAcademicYear(editingAcademicYear._id, academicYearForm);
        Swal.fire({ 
          icon: 'success', 
          title: 'Updated', 
          text: 'Academic year updated successfully!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        await createAcademicYear(academicYearForm);
        Swal.fire({ 
          icon: 'success', 
          title: 'Created', 
          text: 'Academic year created successfully!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
      setShowAcademicYearModal(false);
      fetchSettings();
    } catch (err) {
      console.error('Error in handleSaveAcademicYear:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleDeleteAcademicYear = async (id, year) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete the academic year "${year}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAcademicYear(id);
      Swal.fire({ 
        icon: 'success', 
        title: 'Deleted', 
        text: 'Academic year deleted successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchSettings();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleToggleAcademicYear = async (academicYear) => {
    try {
      await toggleAcademicYearStatus(academicYear._id);
      Swal.fire({ 
        icon: 'success', 
        title: 'Updated', 
        text: `Academic year ${academicYear.isActive ? 'deactivated' : 'activated'} successfully!`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchSettings();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // Check and automatically deactivate expired academic years
  const checkAndUpdateExpiredAcademicYears = async (academicYearsData) => {
    const currentDate = new Date();
    const updatedAcademicYears = [...academicYearsData];
    let hasChanges = false;

    for (let i = 0; i < updatedAcademicYears.length; i++) {
      const academicYear = updatedAcademicYears[i];
      
      // Only check active academic years that have an end date
      if (academicYear.isActive && academicYear.endDate) {
        const endDate = new Date(academicYear.endDate);
        
        // If end date has passed, automatically deactivate
        if (endDate < currentDate) {
          try {
            await toggleAcademicYearStatus(academicYear._id);
            updatedAcademicYears[i] = { ...academicYear, isActive: false };
            hasChanges = true;
            
            // Show notification for auto-deactivation
            Swal.fire({
              icon: 'info',
              title: 'Academic Year Auto-Deactivated',
              text: `"${academicYear.year || academicYear.name}" has been automatically deactivated as its end date has passed.`,
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 5000
            });
          } catch (error) {
            console.error(`Failed to auto-deactivate academic year ${academicYear._id}:`, error);
          }
        }
      }
    }

    return updatedAcademicYears;
  };

  // Sections Management
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionForm({ name: '' });
    setSavingSection(false);
    setShowSectionModal(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionForm({ name: section.name });
    setSavingSection(false);
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.name || sectionForm.name.trim() === '') {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validation Error', 
        text: 'Section name is required and cannot be empty.' 
      });
      return;
    }

    // Trim the name to remove extra spaces
    const trimmedName = sectionForm.name.trim();
    
    // Check if name is too short
    if (trimmedName.length < 1) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validation Error', 
        text: 'Section name must be at least 1 character long.' 
      });
      return;
    }

    // Prevent multiple submissions
    if (savingSection) return;
    
    setSavingSection(true);

    try {
      console.log('Saving section:', { editingSection, sectionForm, trimmedName });
      
      if (editingSection) {
        console.log('Updating existing section:', editingSection._id);
        const result = await updateSection(editingSection._id, { name: trimmedName });
        console.log('Update result:', result);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Section Updated!', 
          text: `Section "${trimmedName}" has been updated successfully!`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        console.log('Creating new section:', trimmedName);
        const result = await addSection(trimmedName);
        console.log('Create result:', result);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Section Created!', 
          text: `Section "${trimmedName}" has been created successfully!`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      }
      
      setShowSectionModal(false);
      setSectionForm({ name: '' });
      setEditingSection(null);
      
      // Refresh the settings to get updated data
      await fetchSettings();
      
    } catch (err) {
      console.error('Error in handleSaveSection:', err);
      
      let errorMessage = 'An unexpected error occurred while saving the section.';
      
      if (err.message) {
        if (err.message.includes('already exists')) {
          errorMessage = `A section with the name "${trimmedName}" already exists. Please choose a different name.`;
        } else if (err.message.includes('required')) {
          errorMessage = 'Section name is required.';
        } else if (err.message.includes('Failed to add section')) {
          errorMessage = 'Failed to add section. Please check your connection and try again.';
        } else if (err.message.includes('Failed to update section')) {
          errorMessage = 'Failed to update section. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Error Saving Section', 
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (id) => {
    const section = sections.find(s => s._id === id);
    if (!section) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Section Not Found', 
        text: 'The section you are trying to delete could not be found.' 
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Section?',
      text: `Are you sure you want to permanently delete the section "${section.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });
    
    if (!result.isConfirmed) return;

    try {
      console.log('Deleting section:', id, section.name);
      const result = await deleteSection(id);
      console.log('Delete result:', result);
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Section Deleted!', 
        text: `Section "${section.name}" has been deleted successfully.`,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'OK',
        timer: 3000,
        timerProgressBar: true
      });
      
      // Refresh the settings to get updated data
      await fetchSettings();
      
    } catch (err) {
      console.error('Error deleting section:', err);
      
      let errorMessage = 'An unexpected error occurred while deleting the section.';
      
      if (err.message) {
        if (err.message.includes('not found')) {
          errorMessage = 'The section could not be found. It may have been deleted by another user.';
        } else if (err.message.includes('Failed to delete section')) {
          errorMessage = 'Failed to delete section. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Error Deleting Section', 
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleToggleSection = async (section) => {
    try {
      await updateSection(section._id, { isActive: !section.isActive });
      Swal.fire({ 
        icon: 'success', 
        title: 'Updated', 
        text: `Section ${section.isActive ? 'deactivated' : 'activated'} successfully!`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchSettings();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // Year Levels Management
  const handleAddYearLevel = () => {
    setEditingYearLevel(null);
    setYearLevelForm({ name: '' });
    setSavingYearLevel(false);
    setShowYearLevelModal(true);
  };

  const handleEditYearLevel = (yearLevel) => {
    setEditingYearLevel(yearLevel);
    setYearLevelForm({ name: yearLevel.name });
    setSavingYearLevel(false);
    setShowYearLevelModal(true);
  };

  const handleSaveYearLevel = async () => {
    if (!yearLevelForm.name || yearLevelForm.name.trim() === '') {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validation Error', 
        text: 'Year level name is required and cannot be empty.' 
      });
      return;
    }

    // Trim the name to remove extra spaces
    const trimmedName = yearLevelForm.name.trim();
    
    // Check if name is too short
    if (trimmedName.length < 1) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validation Error', 
        text: 'Year level name must be at least 1 character long.' 
      });
      return;
    }

    // Prevent multiple submissions
    if (savingYearLevel) return;
    
    setSavingYearLevel(true);

    try {
      console.log('Saving year level:', { editingYearLevel, yearLevelForm, trimmedName });
      
      if (editingYearLevel) {
        console.log('Updating existing year level:', editingYearLevel._id);
        const result = await updateYearLevel(editingYearLevel._id, { name: trimmedName });
        console.log('Update result:', result);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Year Level Updated!', 
          text: `Year level "${trimmedName}" has been updated successfully!`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        console.log('Creating new year level:', trimmedName);
        const result = await addYearLevel(trimmedName);
        console.log('Create result:', result);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Year Level Created!', 
          text: `Year level "${trimmedName}" has been created successfully!`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      }
      
      setShowYearLevelModal(false);
      setYearLevelForm({ name: '' });
      setEditingYearLevel(null);
      
      // Refresh the settings to get updated data
      await fetchSettings();
      
    } catch (err) {
      console.error('Error in handleSaveYearLevel:', err);
      
      let errorMessage = 'An unexpected error occurred while saving the year level.';
      
      if (err.message) {
        if (err.message.includes('already exists')) {
          errorMessage = `A year level with the name "${trimmedName}" already exists. Please choose a different name.`;
        } else if (err.message.includes('required')) {
          errorMessage = 'Year level name is required.';
        } else if (err.message.includes('Failed to add year level')) {
          errorMessage = 'Failed to add year level. Please check your connection and try again.';
        } else if (err.message.includes('Failed to update year level')) {
          errorMessage = 'Failed to update year level. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Error Saving Year Level', 
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    } finally {
      setSavingYearLevel(false);
    }
  };

  const handleDeleteYearLevel = async (id) => {
    const yearLevel = yearLevels.find(yl => yl._id === id);
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete the year level "${yearLevel.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    try {
      await deleteYearLevel(id);
      Swal.fire({ 
        icon: 'success', 
        title: 'Deleted', 
        text: 'Year level deleted successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchSettings();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleToggleYearLevel = async (yearLevel) => {
    try {
      await updateYearLevel(yearLevel._id, { isActive: !yearLevel.isActive });
      Swal.fire({ 
        icon: 'success', 
        title: 'Updated', 
        text: `Year level ${yearLevel.isActive ? 'deactivated' : 'activated'} successfully!`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchSettings();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // Departments Management
  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setDepartmentForm({ name: '' });
    setSavingDepartment(false);
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDepartmentForm({ name: department.name });
    setSavingDepartment(false);
    setShowDepartmentModal(true);
  };

  const handleSaveDepartment = async () => {
    if (!departmentForm.name || departmentForm.name.trim() === '') {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validation Error', 
        text: 'Department name is required and cannot be empty.' 
      });
      return;
    }

    // Trim the name to remove extra spaces
    const trimmedName = departmentForm.name.trim();
    
    // Check if name is too short
    if (trimmedName.length < 1) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Validation Error', 
        text: 'Department name must be at least 1 character long.' 
      });
      return;
    }

    // Prevent multiple submissions
    if (savingDepartment) return;
    
    setSavingDepartment(true);



    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    console.log('Auth check - Token exists:', !!token, 'Role:', role);
    
    if (!token) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Authentication Error', 
        text: 'You are not logged in. Please log in again.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
      setSavingDepartment(false);
      return;
    }
    
    if (role !== 'Admin') {
      Swal.fire({ 
        icon: 'error', 
        title: 'Permission Error', 
        text: 'You do not have permission to manage departments. Only administrators can perform this action.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
      setSavingDepartment(false);
      return;
    }

    try {
      console.log('Saving department:', { editingDepartment, departmentForm, trimmedName });
      
      if (editingDepartment) {
        console.log('Updating existing department:', editingDepartment._id);
        const result = await updateDepartment(editingDepartment._id, { name: trimmedName });
        console.log('Update result:', result);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Department Updated!', 
          text: `Department "${trimmedName}" has been updated successfully!`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        console.log('Creating new department:', trimmedName);
        console.log('Calling addDepartment with:', trimmedName);
        const result = await addDepartment(trimmedName);
        console.log('Create result:', result);
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Department Created!', 
          text: `Department "${trimmedName}" has been created successfully!`,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      }
      
      setShowDepartmentModal(false);
      setDepartmentForm({ name: '' });
      setEditingDepartment(null);
      
      // Refresh the settings to get updated data
      await fetchSettings();
      
    } catch (err) {
      console.error('Error in handleSaveDepartment:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMessage = 'An unexpected error occurred while saving the department.';
      
      if (err.message) {
        if (err.message.includes('already exists')) {
          errorMessage = `A department with the name "${trimmedName}" already exists. Please choose a different name.`;
        } else if (err.message.includes('required')) {
          errorMessage = 'Department name is required.';
        } else if (err.message.includes('Failed to add department')) {
          errorMessage = 'Failed to add department. Please check your connection and try again.';
        } else if (err.message.includes('Failed to update department')) {
          errorMessage = 'Failed to update department. Please check your connection and try again.';
        } else if (err.message.includes('Unauthorized') || err.message.includes('Forbidden')) {
          errorMessage = 'You do not have permission to perform this action. Please contact an administrator.';
        } else if (err.message.includes('Network Error') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Error Saving Department', 
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    const department = departments.find(d => d._id === id);
    if (!department) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Department Not Found', 
        text: 'The department you are trying to delete could not be found.' 
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Department?',
      text: `Are you sure you want to permanently delete the department "${department.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });
    
    if (!result.isConfirmed) return;

    try {
      console.log('Deleting department:', id, department.name);
      const result = await deleteDepartment(id);
      console.log('Delete result:', result);
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Department Deleted!', 
        text: `Department "${department.name}" has been deleted successfully.`,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'OK',
        timer: 3000,
        timerProgressBar: true
      });
      
      // Refresh the settings to get updated data
      await fetchSettings();
      
    } catch (err) {
      console.error('Error deleting department:', err);
      
      let errorMessage = 'An unexpected error occurred while deleting the department.';
      
      if (err.message) {
        if (err.message.includes('not found')) {
          errorMessage = 'The department could not be found. It may have been deleted by another user.';
        } else if (err.message.includes('Failed to delete department')) {
          errorMessage = 'Failed to delete department. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Error Deleting Department', 
        text: errorMessage,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleToggleDepartment = async (department) => {
    try {
      await updateDepartment(department._id, { isActive: !department.isActive });
      Swal.fire({ 
        icon: 'success', 
        title: 'Updated', 
        text: `Department ${department.isActive ? 'deactivated' : 'activated'} successfully!`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      fetchSettings();
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: err.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // Search functionality
  const filterItems = (items, searchTerm) => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => {
      // Search in name, description, year, etc.
      const searchableFields = [
        item.name || '',
        item.year || '',
        item.description || '',
        item.department || ''
      ].map(field => field.toLowerCase());
      
      return searchableFields.some(field => field.includes(term));
    });
  };

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'academic-years':
        return filterItems(academicYears, searchTerm);
      case 'sections':
        return filterItems(sections, searchTerm);
      case 'year-levels':
        return filterItems(yearLevels, searchTerm);
      case 'departments':
        return filterItems(departments, searchTerm);
      default:
        return [];
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="registration-management-page">
        <div className="loading-section">
          <FaSpinner className="loading-spinner" />
          <h3>Loading Registration Settings</h3>
          <p>Please wait while we fetch your registration data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="registration-management-page">
        <div className="error-section">
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => fetchSettings()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-management-page">
      <div className="registration-management-background">
        <div className="background-pattern"></div>
      </div>

      <div className={`registration-management-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-icon">
              <div className="icon-symbol">📋</div>
            </div>
                                    <div className="header-text">
               <h1 className="header-title">Manage Registration</h1>
               <p className="header-subtitle">Manage registration options for academic years, sections, year levels, and departments</p>
             </div>
          </div>
          
          <div className="management-stats">
            <div className="stat-item">
              <span className="stat-number">{academicYears.length}</span>
              <span className="stat-label">Academic Years</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{sections.length}</span>
              <span className="stat-label">Sections</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{yearLevels.length}</span>
              <span className="stat-label">Year Levels</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{departments.length}</span>
              <span className="stat-label">Departments</span>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <div className="management-tabs">
          <div className="tabs-header">
                         <button 
               className={`tab-button ${activeTab === 'academic-years' ? 'active' : ''}`}
               onClick={() => setActiveTab('academic-years')}
             >
               <span>Academic Years</span>
             </button>
             <button 
               className={`tab-button ${activeTab === 'sections' ? 'active' : ''}`}
               onClick={() => setActiveTab('sections')}
             >
               <span>Sections</span>
             </button>
             <button 
               className={`tab-button ${activeTab === 'year-levels' ? 'active' : ''}`}
               onClick={() => setActiveTab('year-levels')}
             >
               <span>Year Levels</span>
             </button>
             <button 
               className={`tab-button ${activeTab === 'departments' ? 'active' : ''}`}
               onClick={() => setActiveTab('departments')}
             >
               <span>Departments</span>
             </button>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search-button"
                    onClick={clearSearch}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="search-results-info">
                  <span className="results-count">
                    {getFilteredItems().length} of {(() => {
                      switch (activeTab) {
                        case 'academic-years': return academicYears.length;
                        case 'sections': return sections.length;
                        case 'year-levels': return yearLevels.length;
                        case 'departments': return departments.length;
                        default: return 0;
                      }
                    })()} items found
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Academic Years Tab */}
            {activeTab === 'academic-years' && (
              <div className="tab-panel">
                <div className="section-header">
                  <h3 className="section-title">Academic Years</h3>
                  <button className="add-button" onClick={handleAddAcademicYear}>
                    Add Academic Year
                  </button>
                </div>
                
                {getFilteredItems().length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <h4>No Results Found</h4>
                        <p>No academic years match your search "{searchTerm}"</p>
                        <button className="clear-search-button" onClick={clearSearch}>
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <h4>No Academic Years</h4>
                        <p>Start by adding your first academic year</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="items-grid">
                    {getFilteredItems().map(academicYear => (
                      <div key={academicYear._id} className={`management-card ${academicYear.isActive ? 'active' : 'inactive'}`}>
                        <div className="card-header">
                          <h5 className="card-title">{academicYear.year || academicYear.name}</h5>
                          <div className={`status-badge ${academicYear.isActive ? 'active' : (academicYear.endDate && new Date(academicYear.endDate) < new Date() ? 'expired' : 'inactive')}`}>
                            <span className="status-text">
                              {academicYear.isActive ? 'Active' : 'Inactive'}
                              {!academicYear.isActive && academicYear.endDate && new Date(academicYear.endDate) < new Date() && ' (Expired)'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <p className="description">{academicYear.description || 'No description'}</p>
                          
                          <div className="date-range">
                            <div className="date-item">
                              <span className="date-label">Start:</span>
                              <span className="date-value">
                                {academicYear.startDate 
                                  ? new Date(academicYear.startDate).toLocaleDateString() 
                                  : 'Not set'
                                }
                              </span>
                            </div>
                            <div className="date-item">
                              <span className="date-label">End:</span>
                              <span className={`date-value ${academicYear.endDate && new Date(academicYear.endDate) < new Date() ? 'expired-date' : ''}`}>
                                {academicYear.endDate 
                                  ? new Date(academicYear.endDate).toLocaleDateString() 
                                  : 'Not set'
                                }
                                {academicYear.endDate && new Date(academicYear.endDate) < new Date() && (
                                  <span className="expired-indicator"> (Expired)</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card-actions">
                          <button 
                            className="action-button edit-button"
                            onClick={() => handleEditAcademicYear(academicYear)}
                          >
                            Edit
                          </button>
                          <button 
                            className={`action-button toggle-button ${academicYear.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleAcademicYear(academicYear)}
                          >
                            {academicYear.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="action-button delete-button"
                            onClick={() => handleDeleteAcademicYear(academicYear._id, academicYear.year || academicYear.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <div className="tab-panel">
                <div className="section-header">
                  <h3 className="section-title">Sections</h3>
                  <button className="add-button" onClick={handleAddSection}>
                    Add Section
                  </button>
                </div>
                
                {getFilteredItems().length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <h4>No Results Found</h4>
                        <p>No sections match your search "{searchTerm}"</p>
                        <button className="clear-search-button" onClick={clearSearch}>
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <h4>No Sections</h4>
                        <p>Start by adding your first section</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="items-grid">
                    {getFilteredItems().map(section => (
                      <div key={section._id} className={`management-card ${section.isActive ? 'active' : 'inactive'}`}>
                        <div className="card-header">
                          <h5 className="card-title">{section.name}</h5>
                          <div className={`status-badge ${section.isActive ? 'active' : 'inactive'}`}>
                            <span className="status-text">{section.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <div className="created-date">
                            <span>Created: {new Date(section.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="card-actions">
                          <button 
                            className="action-button edit-button"
                            onClick={() => handleEditSection(section)}
                          >
                            Edit
                          </button>
                          <button 
                            className={`action-button toggle-button ${section.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleSection(section)}
                          >
                            {section.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="action-button delete-button"
                            onClick={() => handleDeleteSection(section._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Year Levels Tab */}
            {activeTab === 'year-levels' && (
              <div className="tab-panel">
                <div className="section-header">
                  <h3 className="section-title">Year Levels</h3>
                  <button className="add-button" onClick={handleAddYearLevel}>
                    Add Year Level
                  </button>
                </div>
                
                {getFilteredItems().length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <h4>No Results Found</h4>
                        <p>No year levels match your search "{searchTerm}"</p>
                        <button className="clear-search-button" onClick={clearSearch}>
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <h4>No Year Levels</h4>
                        <p>Start by adding your first year level</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="items-grid">
                    {getFilteredItems().map(yearLevel => (
                      <div key={yearLevel._id} className={`management-card ${yearLevel.isActive ? 'active' : 'inactive'}`}>
                        <div className="card-header">
                          <h5 className="card-title">{yearLevel.name}</h5>
                          <div className={`status-badge ${yearLevel.isActive ? 'active' : 'inactive'}`}>
                            <span className="status-text">{yearLevel.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <div className="created-date">
                            <span>Created: {new Date(yearLevel.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="card-actions">
                          <button 
                            className="action-button edit-button"
                            onClick={() => handleEditYearLevel(yearLevel)}
                          >
                            Edit
                          </button>
                          <button 
                            className={`action-button toggle-button ${yearLevel.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleYearLevel(yearLevel)}
                          >
                            {yearLevel.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="action-button delete-button"
                            onClick={() => handleDeleteYearLevel(yearLevel._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <div className="tab-panel">
                                                  <div className="section-header">
                   <h3 className="section-title">Departments</h3>
                   <button className="add-button" onClick={handleAddDepartment}>
                     Add Department
                   </button>
                 </div>
                
                {getFilteredItems().length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <h4>No Results Found</h4>
                        <p>No departments match your search "{searchTerm}"</p>
                        <button className="clear-search-button" onClick={clearSearch}>
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <h4>No Departments</h4>
                        <p>Start by adding your first department</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="items-grid">
                    {getFilteredItems().map(department => (
                      <div key={department._id} className={`management-card ${department.isActive ? 'active' : 'inactive'}`}>
                        <div className="card-header">
                          <h5 className="card-title">{department.name}</h5>
                          <div className={`status-badge ${department.isActive ? 'active' : 'Inactive'}`}>
                            <span className="status-text">{department.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <div className="created-date">
                            <span>Created: {new Date(department.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="card-actions">
                                                     <button 
                             className="action-button edit-button"
                             onClick={() => handleEditDepartment(department)}
                           >
                             Edit
                           </button>
                                                     <button 
                             className={`action-button toggle-button ${department.isActive ? 'deactivate' : 'activate'}`}
                             onClick={() => handleToggleDepartment(department)}
                           >
                             {department.isActive ? 'Deactivate' : 'Activate'}
                           </button>
                                                     <button 
                             className="action-button delete-button"
                             onClick={() => handleDeleteDepartment(department._id)}
                           >
                             Delete
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Academic Year Modal */}
        {showAcademicYearModal && (
          <div className="modal-overlay" onClick={() => setShowAcademicYearModal(false)}>
            <div className="modal-content create-event-style-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header create-event-style-header">
                <div className="modal-title-section">
                  <div className="modal-icon">
                    <div className="icon-symbol">📚</div>
                  </div>
                  <h3 className="modal-title">
                    {editingAcademicYear ? 'Edit Academic Year' : 'Add New Academic Year'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingAcademicYear ? '' : 'Fill out the details below to create a new academic year'}
                  </p>
                </div>
                <button className="modal-close create-event-style-close" onClick={() => setShowAcademicYearModal(false)}>
                  <span>×</span>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAcademicYear(); }} className="modal-form create-event-style-form">
                <div className="modal-body create-event-style-body">
                  <div className="modal-form-section">
                    <h3 className="modal-section-title">Academic Year Details</h3>
                    
                    <div className="modal-form-field">
                      <div className="modal-input-wrapper">
                        <input
                          type="text"
                          name="year"
                          value={academicYearForm.year}
                          onChange={(e) => setAcademicYearForm(prev => ({ ...prev, year: e.target.value }))}
                          placeholder="e.g., 2024-2025"
                          className="modal-form-input"
                          required
                        />
                        <div className="input-focus-line"></div>
                      </div>
                      <div className="form-hint">Format: YYYY-YYYY (e.g., 2024-2025)</div>
                    </div>

                    <div className="modal-form-field">
                      <div className="modal-input-wrapper">
                        <input
                          type="text"
                          name="description"
                          value={academicYearForm.description}
                          onChange={(e) => setAcademicYearForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="e.g., Current Academic Year"
                          className="modal-form-input"
                        />
                        <div className="input-focus-line"></div>
                      </div>
                      <div className="form-hint">Optional description for the academic year</div>
                    </div>
                  </div>

                  <div className="modal-form-section">
                    <h3 className="modal-section-title">Date Range</h3>
                    
                    <div className="modal-form-row">
                      <div className="modal-form-field">
                        <div className="modal-input-wrapper">
                          <input
                            type="date"
                            name="startDate"
                            value={academicYearForm.startDate}
                            onChange={(e) => setAcademicYearForm(prev => ({ ...prev, startDate: e.target.value }))}
                            className="modal-form-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <div className="form-hint">Select the start date</div>
                      </div>
                      <div className="modal-form-field">
                        <div className="modal-input-wrapper">
                          <input
                            type="date"
                            name="endDate"
                            value={academicYearForm.endDate}
                            onChange={(e) => setAcademicYearForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="modal-form-input"
                          />
                          <div className="input-focus-line"></div>
                        </div>
                        <div className="form-hint">Select the end date</div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-form-section">
                    <h3 className="modal-section-title">Status</h3>
                    
                    <div className="modal-form-field">
                      <label className="form-checkbox-label">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={academicYearForm.isActive}
                          onChange={(e) => setAcademicYearForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="form-checkbox"
                        />
                        <span className="checkbox-slider"></span>
                        <span className="checkbox-text">Active</span>
                      </label>
                      <div className="form-hint">Active academic years will appear in the registration dropdown</div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer create-event-style-footer">
                  <button type="button" className="cancel-button create-event-style-cancel" onClick={() => setShowAcademicYearModal(false)}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" className="save-button create-event-style-save">
                    <span>{editingAcademicYear ? 'Update Academic Year' : 'Create Academic Year'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section Modal */}
        {showSectionModal && (
          <div className="modal-overlay" onClick={() => {
            if (!savingSection) {
              setShowSectionModal(false);
              setSectionForm({ name: '' });
              setEditingSection(null);
              setSavingSection(false);
            }
          }}>
            <div className="modal-content create-event-style-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header create-event-style-header">
                <div className="modal-title-section">
                  <div className="modal-icon">
                    <div className="icon-symbol">📋</div>
                  </div>
                  <h3 className="modal-title">
                    {editingSection ? 'Edit Section' : 'Add New Section'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingSection ? '' : 'Fill out the details below to create a new section'}
                  </p>
                </div>
                <button className="modal-close create-event-style-close" onClick={() => {
                  if (!savingSection) {
                    setShowSectionModal(false);
                    setSectionForm({ name: '' });
                    setEditingSection(null);
                    setSavingSection(false);
                  }
                }} disabled={savingSection}>
                  <span>×</span>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSection(); }} className="modal-form create-event-style-form">
                <div className="modal-body create-event-style-body">
                  <div className="modal-form-section">
                    <h3 className="modal-section-title">Section Information</h3>
                    
                    <div className="form-field">
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={sectionForm.name}
                          onChange={(e) => setSectionForm({ name: e.target.value })}
                          placeholder="e.g., A, B, C, Alpha, Beta"
                          className="form-input"
                          required
                          minLength="1"
                          maxLength="50"
                          autoFocus
                        />
                        <div className="input-focus-line"></div>
                      </div>
                      <div className="form-hint">Enter a unique section name (1-50 characters)</div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer create-event-style-footer">
                  <button type="button" className="cancel-button create-event-style-cancel" onClick={() => {
                    setShowSectionModal(false);
                    setSectionForm({ name: '' });
                    setEditingSection(null);
                    setSavingSection(false);
                  }} disabled={savingSection}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" className="save-button create-event-style-save" disabled={savingSection}>
                    {savingSection ? (
                      <>
                        <FaSpinner />
                        <span>{editingSection ? 'Updating...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{editingSection ? 'Update Section' : 'Create Section'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Year Level Modal */}
        {showYearLevelModal && (
          <div className="modal-overlay" onClick={() => {
            if (!savingYearLevel) {
              setShowYearLevelModal(false);
              setYearLevelForm({ name: '' });
              setEditingYearLevel(null);
              setSavingYearLevel(false);
            }
          }}>
            <div className="modal-content create-event-style-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header create-event-style-header">
                <div className="modal-title-section">
                  <div className="modal-icon">
                    <div className="icon-symbol">🎓</div>
                  </div>
                  <h3 className="modal-title">
                    {editingYearLevel ? 'Edit Year Level' : 'Add New Year Level'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingYearLevel ? '' : 'Fill out the details below to create a new year level'}
                  </p>
                </div>
                <button className="modal-close create-event-style-close" onClick={() => {
                  if (!savingYearLevel) {
                    setShowYearLevelModal(false);
                    setYearLevelForm({ name: '' });
                    setEditingYearLevel(null);
                    setSavingYearLevel(false);
                  }
                }} disabled={savingYearLevel}>
                  <span>×</span>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveYearLevel(); }} className="modal-form create-event-style-form">
                <div className="modal-body create-event-style-body">
                  <div className="modal-form-section">
                    <h3 className="modal-section-title">Year Level Information</h3>
                    
                    <div className="form-field">
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={yearLevelForm.name}
                          onChange={(e) => setYearLevelForm({ name: e.target.value })}
                          placeholder="e.g., 1st Year, 2nd Year, Freshman, Sophomore"
                          className="form-input"
                          required
                          minLength="1"
                          maxLength="50"
                          autoFocus
                        />
                        <div className="input-focus-line"></div>
                      </div>
                      <div className="form-hint">Enter a unique year level name (1-50 characters)</div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer create-event-style-footer">
                  <button type="button" className="cancel-button create-event-style-cancel" onClick={() => {
                    setShowYearLevelModal(false);
                    setYearLevelForm({ name: '' });
                    setEditingYearLevel(null);
                    setSavingYearLevel(false);
                  }} disabled={savingYearLevel}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" className="save-button create-event-style-save" disabled={savingYearLevel}>
                    {savingYearLevel ? (
                      <>
                        <FaSpinner />
                        <span>{editingYearLevel ? 'Updating...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{editingYearLevel ? 'Update Year Level' : 'Create Year Level'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDepartmentModal && (
          <div className="modal-overlay" onClick={() => {
            if (!savingDepartment) {
              setShowDepartmentModal(false);
              setDepartmentForm({ name: '' });
              setEditingDepartment(null);
              setSavingDepartment(false);
            }
          }}>
            <div className="modal-content create-event-style-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header create-event-style-header">
                <div className="modal-title-section">
                  <div className="modal-icon">
                    <div className="icon-symbol">🏢</div>
                  </div>
                  <h3 className="modal-title">
                    {editingDepartment ? 'Edit Department' : 'Add New Department'}
                  </h3>
                  <p className="modal-subtitle">
                    {editingDepartment ? '' : 'Fill out the details below to create a new department'}
                  </p>
                </div>
                <button className="modal-close create-event-style-close" onClick={() => {
                  if (!savingDepartment) {
                    setShowDepartmentModal(false);
                    setDepartmentForm({ name: '' });
                    setEditingDepartment(null);
                    setSavingDepartment(false);
                  }
                }} disabled={savingDepartment}>
                  <span>×</span>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveDepartment(); }} className="modal-form create-event-style-form">
                <div className="modal-body create-event-style-body">
                  <div className="modal-form-section">
                    <h3 className="modal-section-title">Department Information</h3>
                    
                    <div className="form-field">
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={departmentForm.name}
                          onChange={(e) => setDepartmentForm({ name: e.target.value })}
                          placeholder="e.g., School of Arts and Sciences, College of Engineering"
                          className="form-input"
                          required
                          minLength="1"
                          maxLength="100"
                          autoFocus
                        />
                        <div className="input-focus-line"></div>
                      </div>
                      <div className="form-hint">Enter a unique department name (1-100 characters)</div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer create-event-style-footer">
                  <button type="button" className="cancel-button create-event-style-cancel" onClick={() => {
                    setShowDepartmentModal(false);
                    setDepartmentForm({ name: '' });
                    setEditingDepartment(null);
                    setSavingDepartment(false);
                  }} disabled={savingDepartment}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" className="save-button create-event-style-save" disabled={savingDepartment}>
                    {savingDepartment ? (
                      <>
                        <FaSpinner />
                        <span>{editingDepartment ? 'Updating...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{editingDepartment ? 'Update Department' : 'Create Department'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegistrationManagementPage; 