# ARMitect

ARMitect is a web-based application that simplifies Azure infrastructure design by converting ARM templates into interactive diagrams and vice versa. It helps users understand, build, and export ARM templates visually, making cloud deployments accessible to users of all skill levels.

## Features

### MVP

- Upload ARM template to generate diagram
- Drag-and-drop diagram builder
- Export diagram as ARM template
- Import existing templates into editor
- AI-powered summary of template represented actions

### Stretch Goals

- Real-time validation of template logic
- Collaborative editing mode
- Support for multiple Azure resource types

## Getting Started

ARMitect is designed to be intuitive and easy to use. Users can:

1. Upload an existing ARM template to visualize its structure.
2. Use the drag-and-drop interface to build or modify infrastructure diagrams.
3. Export the diagram as a valid ARM template for deployment.
4. View AI-generated summaries to understand the template's purpose and actions.

## Backend Architecture

ARMitect includes a backend built in **NodeJS**, chosen for its performance and safety. The backend supports:

- AI integration for summarizing template logic
- REST API endpoints for future features like collaboration and storage

## Success Metrics

- Users can upload and visualize ARM templates
- Users can build and export valid ARM templates from diagrams
- AI summaries provide accurate insights
- Positive feedback from testers on usability and clarity

## License

This project is licensed under the MIT License. See the LICENSE file for details.
