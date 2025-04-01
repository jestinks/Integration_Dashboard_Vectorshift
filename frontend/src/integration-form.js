import { useState } from 'react';
import {
    Box,
    Autocomplete,
    TextField,
    Paper,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import { AirtableIntegration } from './integrations/airtable';
import { NotionIntegration } from './integrations/notion';
import { HubspotIntegration } from './integrations/hubspot';
import { DataForm } from './data-form';

const integrationMapping = {
    'Notion': NotionIntegration,
    'Airtable': AirtableIntegration,
    'Hubspot': HubspotIntegration,
};

export const IntegrationForm = () => {
    const [integrationParams, setIntegrationParams] = useState({});
    const [user, setUser] = useState('TestUser');
    const [org, setOrg] = useState('TestOrg');
    const [currType, setCurrType] = useState(null);
    const [error, setError] = useState(null);
    const CurrIntegration = integrationMapping[currType];

    return (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box display='flex' flexDirection='column' gap={3}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Integration Setup
                </Typography>
                
                <Box display='flex' flexDirection='column' gap={2}>
                    <TextField
                        label="User"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        label="Organization"
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        fullWidth
                        variant="outlined"
                    />
                    <Autocomplete
                        id="integration-type"
                        options={Object.keys(integrationMapping)}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Integration Type" 
                                variant="outlined"
                            />
                        )}
                        onChange={(e, value) => {
                            setCurrType(value);
                            setError(null);
                        }}
                        fullWidth
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {currType && (
                    <Box sx={{ mt: 2 }}>
                        <CurrIntegration 
                            user={user} 
                            org={org} 
                            integrationParams={integrationParams} 
                            setIntegrationParams={setIntegrationParams}
                            onError={(err) => setError(err)}
                        />
                    </Box>
                )}

                {integrationParams?.credentials && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Data Management
                        </Typography>
                        <DataForm 
                            integrationType={integrationParams?.type} 
                            credentials={integrationParams?.credentials} 
                        />
                    </Box>
                )}
            </Box>
        </Paper>
    );
}