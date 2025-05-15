import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

/**
 * Export a journal entry as an image (PNG)
 * @param element The HTML element to convert to image
 * @param title Title of the journal entry for the filename
 */
export const exportAsImage = async (element: HTMLElement, title: string) => {
  try {
    // Create canvas from the element with better styling
    const styledElement = prepareElementForExport(element, title);
    
    const canvas = await html2canvas(styledElement, {
      scale: 2, // Higher resolution
      useCORS: true, // Allow images from other domains
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedElement) => {
        // Additional styling for the cloned element if needed
        clonedElement.style.padding = '30px';
        clonedElement.style.borderRadius = '0'; // Remove border radius for clean export
      }
    });

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
      }, 'image/png', 1.0);
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create safe filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    link.download = `journal_${safeTitle}_${timestamp}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting as image:', error);
    return false;
  }
};

/**
 * Export a journal entry as HTML
 * @param element The HTML element to export
 * @param title Title of the journal entry for the filename
 * @param stylesheets Optional array of stylesheet URLs to include
 */
export const exportAsHTML = (element: HTMLElement, title: string, stylesheets: string[] = []) => {
  try {
    // Create a styled container with the content
    const styledElement = prepareElementForExport(element, title);
    
    // Get all styles from the page
    const styles = Array.from(document.styleSheets)
      .filter(sheet => {
        try {
          // Only include same-origin stylesheets
          return sheet.cssRules !== null;
        } catch (e) {
          return false;
        }
      })
      .map(sheet => {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      })
      .join('\n');
    
    // Create HTML document with improved styling
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title} - Journal Export</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #f9f9f9;
            }
            .journal-container {
              border: 1px solid #e1e1e1;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 12px rgba(0,0,0,0.05);
              background-color: #fff;
            }
            h1 {
              color: #333;
              border-bottom: 1px solid #eee;
              padding-bottom: 15px;
              margin-top: 0;
              font-size: 24px;
            }
            .date {
              color: #888;
              font-size: 14px;
              margin-bottom: 20px;
            }
            p {
              margin-bottom: 16px;
              font-size: 16px;
            }
            img, video, audio, iframe {
              max-width: 100%;
              height: auto;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            ${styles}
          </style>
          ${stylesheets.map(url => `<link rel="stylesheet" href="${url}">`).join('\n')}
        </head>
        <body>
          <div class="journal-container">
            <h1>${title}</h1>
            <div class="date">${format(new Date(), 'PPPP')}</div>
            <div class="journal-content">
              ${styledElement.innerHTML}
            </div>
            <div class="footer">
              Exported from Aura Bloom Therapy Journal on ${format(new Date(), 'PPP')}
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create safe filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    link.download = `journal_${safeTitle}_${timestamp}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting as HTML:', error);
    return false;
  }
};

/**
 * Export a journal entry as PDF
 * @param element The HTML element to convert to PDF
 * @param title Title of the journal entry for the filename
 */
export const exportAsPDF = async (element: HTMLElement, title: string) => {
  try {
    // Create styled element for export
    const styledElement = prepareElementForExport(element, title);
    
    // Create canvas from the element
    const canvas = await html2canvas(styledElement, {
      scale: 2, // Higher resolution
      useCORS: true, // Allow images from other domains
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedElement) => {
        // Additional styling for the cloned element if needed
        clonedElement.style.padding = '30px';
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions (A4)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate image dimensions to fit in PDF
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 20; // Top margin
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(title, pdfWidth / 2, 10, { align: 'center' });
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Add footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Exported from Aura Bloom Therapy Journal on ${format(new Date(), 'PPP')}`, 
      pdfWidth / 2, pdfHeight - 10, { align: 'center' });
    
    // Create safe filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `journal_${safeTitle}_${timestamp}.pdf`;
    
    // Save PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    return false;
  }
};

/**
 * Prepare an element for export by cleaning up and styling
 */
const prepareElementForExport = (element: HTMLElement, title: string): HTMLElement => {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Create a container for styling
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#333333';
  container.style.lineHeight = '1.6';
  
  // Add title
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  titleElement.style.fontSize = '24px';
  titleElement.style.marginBottom = '10px';
  titleElement.style.paddingBottom = '10px';
  titleElement.style.borderBottom = '1px solid #eeeeee';
  container.appendChild(titleElement);
  
  // Add date
  const dateElement = document.createElement('div');
  dateElement.textContent = format(new Date(), 'PPPP');
  dateElement.style.fontSize = '14px';
  dateElement.style.color = '#888888';
  dateElement.style.marginBottom = '20px';
  container.appendChild(dateElement);
  
  // Add content
  const contentElement = document.createElement('div');
  contentElement.className = 'journal-content';
  contentElement.innerHTML = clone.innerHTML;
  container.appendChild(contentElement);
  
  // Append to document for rendering
  document.body.appendChild(container);
  
  return container;
}; 