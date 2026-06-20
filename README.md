# Vortex Cloud Platform

Vortex is a powerful, integrated infrastructure and cloud database engine designed for seamless deployment and management of your applications.

## Getting Online (Cloud Agent Deployment)

To deploy your application from a cloud agent to your own custom domain, vortex handles the DNS routing and agent allocation automatically:

1. **Access Settings:** Navigate to your project's dashboard in the Vortex console.
2. **Configure Domain:** Select the "Domains" tab within the project settings.
3. **Allocate Agent Subdomain:** Click the "Allocate Agent Subdomain" button.
4. **Set Domain Record:** Enter your desired custom domain. The system will provide a CNAME record value.
5. **Update DNS:** Configure your DNS provider with this CNAME record, pointing to the agent's provided endpoint.
6. **Activate:** Once DNS propagation is complete, the cloud agent will finalize the SSL handshake and bring your application live in the cloud.
