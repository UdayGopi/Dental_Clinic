/**
 * Format template content by replacing variables with readable placeholders
 */
export function formatTemplatePreview(content: string | null | undefined): string {
  if (!content) return 'No content'
  
  return content
    .replace(/\{\{patient_first_name\}\}/gi, 'John')
    .replace(/\{\{patient_last_name\}\}/gi, 'Doe')
    .replace(/\{\{patient_name\}\}/gi, 'John Doe')
    .replace(/\{\{appointment_date\}\}/gi, 'Dec 15, 2024')
    .replace(/\{\{appointment_time\}\}/gi, '10:00 AM')
    .replace(/\{\{clinic_name\}\}/gi, 'Dental Clinic')
    .replace(/\{\{clinic_phone\}\}/gi, '(555) 123-4567')
    .replace(/\{\{clinic_address\}\}/gi, '123 Main St')
    .replace(/\{\{[^}]+\}\}/g, '[Variable]')
}

/**
 * Get preview of template content (first N characters)
 */
export function getTemplatePreview(content: string | null | undefined, maxLength: number = 60): string {
  if (!content) return 'No content'
  
  const formatted = formatTemplatePreview(content)
  return formatted.length > maxLength 
    ? `${formatted.substring(0, maxLength)}...` 
    : formatted
}

