import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

// Singleton cache to prevent multiple API calls
let cachedVoucherRoutes = null;
let fetchPromise = null;

const useVoucherNavigation = () => {
  const navigate = useNavigate();
  const [voucherRoutes, setVoucherRoutes] = useState(cachedVoucherRoutes || {});

  useEffect(() => {
    if (cachedVoucherRoutes) return; // Already cached

    // Avoid duplicate API calls across components
    if (!fetchPromise) {
      fetchPromise = axiosInstance.get('/voucher')
        .then(({ data }) => {
          const routesMap = {};
          if (data?.data?.vouchers?.length) {
            data.data.vouchers.forEach(v => {
              if (v.prefix && v.module) {
                routesMap[v.prefix] = v.module;
              }
            });
          }
          cachedVoucherRoutes = routesMap; // Cache globally
          return routesMap;
        })
        .catch(error => {
          console.error('Failed to fetch voucher routes:', error);
          return {};
        });
    }

    fetchPromise.then(routes => {
      setVoucherRoutes(routes);
    });
  }, []);

  const navigateToVoucher = useCallback(
    (docNo) => {
      if (!docNo) {
        console.warn('No document number provided');
        return;
      }

      const prefixMatch = docNo.match(/^[A-Z]+/);
      if (!prefixMatch) {
        console.warn(`Invalid document number format: ${docNo}`);
        return;
      }

      const prefix = prefixMatch[0];
      const moduleRoute = voucherRoutes[prefix];

      if (moduleRoute) {
        navigate(`/${moduleRoute}?voucher=${encodeURIComponent(docNo)}`);
      } else {
        console.warn(`No route found for prefix: ${prefix}`);
      }
    },
    [navigate, voucherRoutes]
  );

  return navigateToVoucher;
};

export default useVoucherNavigation;
