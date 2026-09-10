import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CF_APP_ID = process.env.CASHFREE_APP_ID || 'TEST_APP_ID';
const CF_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY';
const CF_ENV = process.env.CASHFREE_ENV || 'SANDBOX';

const baseURL = CF_ENV === 'PRODUCTION' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-client-id': CF_APP_ID,
  'x-client-secret': CF_SECRET_KEY,
  'x-api-version': '2023-08-01'
});

export const createSubscriptionPlan = async (planId: string, amount: number, name: string) => {
  try {
    const response = await axios.post(`${baseURL}/subscriptions/plans`, {
      plan_id: planId,
      plan_name: name,
      plan_type: 'ON_DEMAND',
      plan_amount: amount,
      plan_currency: 'INR',
      plan_interval_type: 'MONTH',
      plan_intervals: 1,
    }, { headers: getHeaders() });
    
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.code === 'plan_already_exists' || error.response?.status === 409) {
      return { plan_id: planId }; // Already exists
    }
    console.error('Error creating Cashfree plan:', error.response?.data || error.message);
    throw new Error('Failed to create subscription plan');
  }
};

export const createSubscription = async (
  subscriptionId: string, 
  planId: string, 
  customerEmail: string, 
  customerPhone: string,
  customerName: string
) => {
  try {
    const response = await axios.post(`${baseURL}/subscriptions`, {
      subscription_id: subscriptionId,
      plan_id: planId,
      customer_details: {
        customer_email: customerEmail || 'test@example.com',
        customer_phone: customerPhone || '9999999999',
        customer_name: customerName || 'Shop Owner',
      },
      subscription_first_charge_time: new Date().toISOString().split('T')[0],
      subscription_note: 'AgroFlow Monthly Subscription',
    }, { headers: getHeaders() });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating Cashfree subscription:', error.response?.data || error.message);
    throw new Error('Failed to create subscription');
  }
};

export const getSubscriptionStatus = async (subscriptionId: string) => {
  try {
    const response = await axios.get(`${baseURL}/subscriptions/${subscriptionId}`, { 
      headers: getHeaders() 
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Cashfree subscription:', error.response?.data || error.message);
    throw new Error('Failed to get subscription status');
  }
};
