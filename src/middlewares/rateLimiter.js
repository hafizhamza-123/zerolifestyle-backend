import rateLimit from "express-rate-limit";

export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: {
        error: "Too many accounts created from this IP, please try again after 15 minutes"
    },
}); 

export const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 5,    
    message: {
        error: "Too many login attempts from this IP, please try again after 5 minutes"
    },
});


export const forgotPasswordLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: {
        error: "Too many password reset request from this IP, please try again after 5 minutes"
    },
});
