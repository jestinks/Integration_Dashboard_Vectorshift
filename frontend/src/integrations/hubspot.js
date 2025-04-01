// hubspot.js

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

export const HubspotIntegration = ({ user, org, integrationParams, setIntegrationParams }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Function to handle OAuth completion message
    const handleOAuthComplete = async () => {
        console.log('Attempting to get credentials');
        try {
            const formData = new FormData();
            formData.append('user_id', user);
            formData.append('org_id', org);
            const response = await axios.post(`http://localhost:8000/integrations/hubspot/credentials`, formData);
            const credentials = response.data;
            if (credentials) {
                console.log('Successfully got credentials');
                setIsConnecting(false);
                setIsConnected(true);
                setIntegrationParams(prev => ({ ...prev, credentials: credentials, type: 'HubSpot' }));
            }
        } catch (e) {
            console.log('Error getting credentials:', e?.response?.data?.detail);
            setIsConnecting(false);
            alert('Failed to get credentials. Please try again.');
        }
    };

    // Function to open OAuth in a new window
    const handleConnectClick = async () => {
        try {
            setIsConnecting(true);
            
            const formData = new FormData();
            formData.append('user_id', user);
            formData.append('org_id', org);
            const response = await axios.post(`http://localhost:8000/integrations/hubspot/authorize`, formData);
            const authURL = response?.data;

            console.log('Opening OAuth window...');
            const newWindow = window.open(authURL, 'HubSpot Authorization', 'width=800, height=800');
            if (!newWindow) {
                throw new Error('Popup was blocked. Please allow popups for this site.');
            }

            // Add message listener for OAuth completion
            const messageListener = (event) => {
                console.log('Received message:', event.data);
                if (event.data === 'oauth_complete') {
                    console.log('OAuth complete message received');
                    handleOAuthComplete();
                    window.removeEventListener('message', messageListener);
                }
            };
            window.addEventListener('message', messageListener);

            // Polling for the window to close as backup
            const pollTimer = window.setInterval(() => {
                if (newWindow?.closed !== false) {
                    console.log('OAuth window closed');
                    window.clearInterval(pollTimer);
                    window.removeEventListener('message', messageListener);
                    handleOAuthComplete();
                }
            }, 1000);

            // Cleanup if the user cancels by closing the window
            setTimeout(() => {
                if (!isConnected && !newWindow.closed) {
                    console.log('OAuth timeout - cleaning up');
                    newWindow.close();
                    window.removeEventListener('message', messageListener);
                    window.clearInterval(pollTimer);
                    setIsConnecting(false);
                }
            }, 300000); // 5 minute timeout

        } catch (e) {
            console.error('Error in handleConnectClick:', e);
            setIsConnecting(false);
            alert(e?.response?.data?.detail || e.message || 'Error starting authorization');
        }
    };

    useEffect(() => {
        setIsConnected(integrationParams?.credentials ? true : false);
    }, [integrationParams?.credentials]);

    return (
        <>
            <Box sx={{mt: 2}}>
                Parameters
                <Box display='flex' alignItems='center' justifyContent='center' sx={{mt: 2}}>
            <Button
                        variant='contained' 
                        onClick={isConnected ? () => {} : handleConnectClick}
                        color={isConnected ? 'success' : 'primary'}
                        disabled={isConnecting}
                        style={{
                            pointerEvents: isConnected ? 'none' : 'auto',
                            cursor: isConnected ? 'default' : 'pointer',
                            opacity: isConnected ? 1 : undefined
                        }}
                    >
                        {isConnected ? 'HubSpot Connected' : isConnecting ? <CircularProgress size={20} /> : 'Connect to HubSpot'}
            </Button>
        </Box>
            </Box>
        </>
    );
}