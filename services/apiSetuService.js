const axios = require('axios');

/**
 * API Setu Sandbox Service (https://sandbox.api-setu.in)
 * Handles communications with API Setu Sandbox for GSTIN verification
 * and DigiLocker Ministry of Corporate Affairs (MCA) incorporation documents.
 */
class ApiSetuService {
  constructor() {
    this.baseUrl = process.env.API_SETU_BASE_URL || 'https://sandbox.api-setu.in';
    this.clientId = process.env.API_SETU_CLIENT_ID || 'sih26130_sandbox_client';
    this.apiKey = process.env.API_SETU_API_KEY || 'sih26130_sandbox_key';
    this.timeout = 5000; // 5-second timeout for sandbox calls
  }

  /**
   * Generates standard standard Indian MCA / DigiLocker mock response
   * @param {string} pan - 10-character PAN
   * @param {string} [companyName] - Optional fallback company name
   */
  getStandardDigiLockerMock(pan, companyName) {
    const derivedName = companyName || `Apex Maha Industrial Technologies (${pan.slice(0, 5)}) Pvt Ltd`;
    const year = 2018 + (pan.charCodeAt(4) % 6);
    const cin = `U28920MH${year}PTC${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      status: 'SUCCESS',
      source: 'API_SETU_DIGILOCKER_SANDBOX',
      issuedAt: new Date().toISOString(),
      certificate: {
        type: 'CERTIFICATE_OF_INCORPORATION',
        cin: cin,
        companyName: derivedName,
        companyType: 'Private Limited Company',
        rocOffice: 'RoC-Mumbai, Maharashtra',
        registrationNumber: cin.slice(-6),
        incorporationDate: new Date(`${year}-04-16T00:00:00.000Z`),
        registeredAddress: 'Plot No. C-14, MIDC Industrial Area, Phase-II, Chakan, Pune, Maharashtra - 410501',
        authorizedCapitalINR: 20000000,
        paidUpCapitalINR: 10000000,
        directors: [
          { din: '08492011', name: 'Vikramaditya Deshmukh', designation: 'Managing Director' },
          { din: '09182390', name: 'Ananya Rajendra Patil', designation: 'Director' }
        ],
        documentUri: `in.gov.mca.coi-${cin}`,
        digitalSignature: {
          signedBy: 'Registrar of Companies, Maharashtra, Ministry of Corporate Affairs',
          signatureStatus: 'VERIFIED'
        }
      }
    };
  }

  /**
   * Generates standard GSTN mock response for Maharashtra entity
   * @param {string} gst - 15-character GSTIN
   * @param {string} [companyName] - Optional trade/legal name
   */
  getStandardGSTMock(gst, companyName) {
    const derivedName = companyName || `Apex Maha Industrial Technologies Pvt Ltd`;
    return {
      status: 'SUCCESS',
      source: 'API_SETU_GSTN_SANDBOX',
      issuedAt: new Date().toISOString(),
      gstData: {
        gstin: gst,
        legalName: derivedName,
        tradeName: `${derivedName} (MIDC Unit)`,
        taxpayerType: 'Regular',
        gstinStatus: 'Active',
        stateJurisdiction: 'Maharashtra State Tax, Chakan Circle',
        centerJurisdiction: 'Range-IV, Pune-I Commissionerate',
        registrationDate: '2019-07-01',
        principalPlaceOfBusiness: {
          address: 'Plot No. C-14, MIDC Industrial Area, Phase-II, Chakan, Pune, Maharashtra - 410501',
          natureOfBusiness: 'Factory / Manufacturing Unit'
        },
        filingStatusCurrentFiscal: 'Compliant (GSTR-1 & GSTR-3B filed up-to-date)'
      }
    };
  }

  /**
   * Fetch DigiLocker Incorporation Certificate from API Setu Sandbox
   * @param {string} pan - 10-char Indian PAN
   * @param {string} [fallbackCompanyName] - Optional company name
   */
  async fetchDigiLockerIncorporation(pan, fallbackCompanyName) {
    const endpoint = `${this.baseUrl}/v1/mca/coi`;
    try {
      // Connect to the API Setu Sandbox endpoint with authorization headers
      const response = await axios.post(
        endpoint,
        { pan: pan, consent: 'Y' },
        {
          headers: {
            'X-APISETU-CLIENTID': this.clientId,
            'X-APISETU-APIKEY': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      if (response.data && response.status === 200) {
        return {
          fromLiveSandbox: true,
          data: response.data
        };
      }
      return {
        fromLiveSandbox: false,
        data: this.getStandardDigiLockerMock(pan, fallbackCompanyName)
      };
    } catch (error) {
      // Since it's a sandbox environment and live keys/network endpoints may be mocked,
      // fallback smoothly to the standardized mock JSON payload as specified in SIH architecture
      console.warn(`[API Setu Gateway] Sandbox live call to ${endpoint} returned: ${error.message}. Using standard sandbox mock response.`);
      return {
        fromLiveSandbox: false,
        data: this.getStandardDigiLockerMock(pan, fallbackCompanyName)
      };
    }
  }

  /**
   * Fetch GST details from API Setu Sandbox
   * @param {string} gst - 15-char GSTIN
   * @param {string} [fallbackCompanyName] - Optional company name
   */
  async fetchGSTDetails(gst, fallbackCompanyName) {
    const endpoint = `${this.baseUrl}/v1/gstn/taxpayers/${gst}`;
    try {
      // Connect to the API Setu Sandbox endpoint
      const response = await axios.get(endpoint, {
        headers: {
          'X-APISETU-CLIENTID': this.clientId,
          'X-APISETU-APIKEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (response.data && response.status === 200) {
        return {
          fromLiveSandbox: true,
          data: response.data
        };
      }
      return {
        fromLiveSandbox: false,
        data: this.getStandardGSTMock(gst, fallbackCompanyName)
      };
    } catch (error) {
      console.warn(`[API Setu Gateway] Sandbox live call to ${endpoint} returned: ${error.message}. Using standard sandbox mock response.`);
      return {
        fromLiveSandbox: false,
        data: this.getStandardGSTMock(gst, fallbackCompanyName)
      };
    }
  }
}

module.exports = new ApiSetuService();
