function route_request(r)
    -- Note: Reading POST body in LuaHookFixups doesn't work reliably.
    -- All API requests are routed to the Croatia gate (port 8880) by default.
    -- Cross-gate communication is handled by the gates themselves via Domibus.
    -- 
    -- For testing other gates directly, use the gate ports:
    -- - Croatia (HR): http://localhost:8880
    -- - Austria (AT): http://localhost:8881
    -- - Slovenia (SLO): http://localhost:8882
    
    return apache2.DECLINED
end

