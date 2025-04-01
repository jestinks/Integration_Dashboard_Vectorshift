import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Stack,
} from '@mui/material';
import axios from 'axios';

const endpointMapping = {
    'Notion': 'notion',
    'Airtable': 'airtable',
    'HubSpot': 'hubspot', 
};

export const DataForm = ({ integrationType, credentials }) => {
    const [loadedData, setLoadedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const endpoint = endpointMapping[integrationType];

    const handleLoad = async () => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(credentials));
            console.log('Loading data for:', integrationType);
            const response = await axios.post(`http://localhost:8000/integrations/${endpoint}/load`, formData);
            console.log('Received data:', response.data);
            setLoadedData(response.data);
        } catch (e) {
            console.error('Error loading data:', e);
            setError(e?.response?.data?.detail || 'Error loading data');
        } finally {
            setLoading(false);
        }
    }

    const formatData = (data) => {
        if (!data) return '';
        if (Array.isArray(data)) {
            return data.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                created: new Date(item.creation_time).toLocaleString(),
                modified: new Date(item.last_modified_time).toLocaleString()
            }));
        }
        return data;
    };

    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Data Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Integration Type: {integrationType}
                    </Typography>
                    <TextField
                        label="Loaded Data"
                        value={loadedData ? JSON.stringify(formatData(loadedData), null, 2) : ''}
                        multiline
                        rows={6}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        disabled
                        sx={{
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                            }
                        }}
                    />
                </Box>

                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}

                <Stack direction="row" spacing={2}>
                    <Button
                        onClick={handleLoad}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Loading...' : 'Load Data'}
                    </Button>
                    <Button
                        onClick={() => {
                            setLoadedData(null);
                            setError(null);
                        }}
                        variant="outlined"
                        disabled={loading}
                    >
                        Clear Data
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}