import Layout from "./Layout.jsx";

import Home from "./Home";

import InstructorUpload from "./InstructorUpload";

import QuizTake from "./QuizTake";

import Help from "./Help";

import QuizEssay from "./QuizEssay";

import Review from "./Review";

import AssessmentAnalytics from "./AssessmentAnalytics";

import Login from "./Login";

import { AuthProvider } from "@/contexts/AuthContext";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    InstructorUpload: InstructorUpload,
    
    QuizTake: QuizTake,
    
    Help: Help,
    
    QuizEssay: QuizEssay,
    
    Review: Review,
    
    AssessmentAnalytics: AssessmentAnalytics,

    Login: Login,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/InstructorUpload" element={<InstructorUpload />} />
                
                <Route path="/QuizTake" element={<QuizTake />} />
                
                <Route path="/Help" element={<Help />} />
                
                <Route path="/QuizEssay" element={<QuizEssay />} />
                
                <Route path="/Review" element={<Review />} />
                
                <Route path="/AssessmentAnalytics" element={<AssessmentAnalytics />} />

                <Route path="/Login" element={<Login />} />

            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <AuthProvider>
                <PagesContent />
            </AuthProvider>
        </Router>
    );
}