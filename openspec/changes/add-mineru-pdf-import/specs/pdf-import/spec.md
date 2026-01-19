## ADDED Requirements

### Requirement: PDF Upload Interface
The app SHALL provide a PDF upload interface accessible from the main iPod view that allows users to import PDF documents for visual content extraction.

#### Scenario: User opens PDF import modal
- **WHEN** user clicks the "Import PDF" button
- **THEN** a modal dialog opens with a file upload area

#### Scenario: User uploads PDF via file picker
- **WHEN** user selects a PDF file
- **THEN** the file is accepted and processing begins

#### Scenario: Invalid file type rejected
- **WHEN** user attempts to upload a non-PDF file
- **THEN** an error message is displayed indicating only PDF files are accepted

### Requirement: Local PDF Processing Service
The app SHALL connect to a local MinerU-based processing service (localhost:5000) that extracts visual content from PDF documents.

#### Scenario: PDF processed successfully
- **WHEN** a valid PDF is submitted to the local processing service
- **THEN** the service returns extracted images and color information

#### Scenario: Processing indicator shown
- **WHEN** a PDF is being processed
- **THEN** the user sees a loading indicator

#### Scenario: Service unavailable handling
- **WHEN** the local Python service is not running
- **THEN** the user sees an error message with instructions to start the service

### Requirement: Image Extraction
The processing service SHALL extract images from PDF documents that can be used as artwork or visual elements.

#### Scenario: Images extracted from PDF
- **WHEN** a PDF contains images
- **THEN** the images are extracted and returned as base64-encoded data

#### Scenario: User selects extracted image as artwork
- **WHEN** multiple images are extracted
- **THEN** user can select which image to use as iPod artwork

### Requirement: 2D Visual Refinement
The extracted PDF content SHALL be used to refine the 2D iPod visual appearance.

#### Scenario: Extracted image applied as artwork
- **WHEN** user selects an extracted image
- **THEN** the iPod 2D display shows the new artwork

#### Scenario: Color palette extraction
- **WHEN** images are extracted from PDF
- **THEN** dominant colors are analyzed and can be applied to iPod color scheme
