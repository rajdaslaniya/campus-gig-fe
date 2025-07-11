"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import moment from "moment";
import Slider from "react-slick";
import { useSelector } from "react-redux";
import { RootState } from "@/redux";

import { apiCall } from "@/utils/apiCall";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CommonFormModal from "@/components/common/form/CommonFormModal";
import BidSkeletonList from "@/components/skeleton/bidSkeleton";
import GigDetailSkeleton from "@/components/skeleton/gigDetailSkeleton";
import { ArrowLeftIcon, CalendarIcon, CheckCircle, ClockIcon, MessageCircle, TagIcon, Star, Edit } from "lucide-react";
import { gigBidFields } from "@/config/gigbid.config";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface IBid {
  id: string;
  status: string;
  bid_amount: number;
  payment_type: string;
  description: string;
  created_at: string;
  provider: {
    id: string;
    name: string;
    profile?: string;
    avgRating: number;
    totalReview: number;
    about: string;
  };
}

const GigDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { user_id } = useSelector((state: RootState) => state.user);
  const id = params.id;

  const [gigDetails, setGitDetails] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Description");
  const [editBid, setEditBid] = useState<IBid | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const getGitDetails = async () => {
      const response = await apiCall({
        endPoint: `/gigs/${id}`,
        method: "GET",
      });
      if (response?.success) {
        setGitDetails(response.data);
      }
    };
    getGitDetails();
  }, [id]);

  const fetchBids = async () => {
    const response = await apiCall({
      endPoint: `/bids/gig/${id}`,
      method: "GET",
    });
    if (response?.success) {
      setBids(response.data);
    }
  };

  const handleSubmitBid = async (data: any) => {
    try {
      setBidLoading(true);
      const response = await apiCall({
        endPoint: editBid ? `/bids/update/${editBid.id}` : `/bids/create`,
        method: editBid ? "PUT" : "POST",
        body: {
          "gig_id": id,
          "payment_type": data.payment_type,
          "bid_amount": Number(data.bid_amount),
          "description": data.description
        },
      });
      if (response?.success) {
        setIsModalOpen(false);
        setBidLoading(false);
        if (editBid) {
          setEditBid(null);
          const { bid_amount, description, payment_type } = response.data;
          setBids(bids.map((bid) => bid.id === editBid.id ? { ...bid, description, bid_amount, payment_type } : bid));
        } else {
          setBids([response.data, ...bids]);
          setGitDetails((prev: any) => ({ ...prev, hasBid: true }));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      const response = await apiCall({
        endPoint: `/bids/accept/${bidId}`,
        method: "POST",
      });
      if (response?.success) {
        setBids(bids.map((bid) => bid.id === bidId ? { ...bid, updated_at: response.data.updated_at, status: "accepted" } : bid));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "Bids") {
      fetchBids();
    }
  };

  const handleEditBid = (bid: IBid) => {
    setEditBid(bid);
    setIsModalOpen(true);
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const response = await apiCall({
        endPoint: `/bids/delete/${bidId}`,
        method: "DELETE",
      });
      if (response?.success) {
        setBids(bids.filter((bid) => bid.id !== bidId));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const formatDate = (date: Date | string) => {
    const now = moment();
    const inputTime = moment(date);
    const diffInHours = now.diff(inputTime, 'hours');

    if (diffInHours < 24) {
      return inputTime.fromNow();
    } else {
      return inputTime.format('DD/MM/YYYY [at] hh:mm A');
    }
  };

  const renderHeader = () => (
    <div className="mx-auto py-0 px-3 sm:py-0 sm:px-4 lg:px-8 flex items-center">
      <button
        onClick={() => router.back()}
        className="mr-3 p-1 rounded-full hover:bg-gray-100 cursor-pointer flex-shrink-0"
      >
        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
      </button>
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
        {gigDetails.title}
      </h1>
    </div>
  );

  const renderImageSlider = () => (
    <div className="lg:col-span-2 order-1">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="h-auto md:min-h-[360px]">
          <div className="slider h-full">
            <Slider
              speed={3000}
              autoplay={true}
              dots={gigDetails.images.length > 1}
              infinite={gigDetails.images.length > 1}
              customPaging={() => (
                <div className="w-[7px] h-[7px] bg-gray-400 rounded-full transition" />
              )}
            >
              {gigDetails.images.map((image: string, i: number) => (
                <img
                  key={`${i + 1}`}
                  src={image}
                  alt={gigDetails.title}
                  className="max-h-[210px] lg:max-h-[400px] w-full h-full object-cover"
                />
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGigInfo = () => (
    <div className="space-y-3 pb-4">
      <div className="flex items-start text-gray-600">
        <CalendarIcon className="mt-1 h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
        <span className="text-sm sm:text-base break-words">
          {`${moment(gigDetails.start_date_time).format('dddd, MMMM D, YYYY')} - ${moment(gigDetails.end_date_time).format('dddd, MMMM D, YYYY')}`}
        </span>
      </div>
      <div className="flex items-center text-gray-600">
        <ClockIcon className="mt-1 h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
        <span className="text-sm sm:text-base">
          Duration - ({moment(gigDetails.end_date_time).diff(moment(gigDetails.start_date_time), 'days')} days)
        </span>
      </div>
      <div className="flex items-center text-gray-600">
        <TagIcon className="mt-1 h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400 flex-shrink-0" />
        <div className="text-sm sm:text-base">
          {gigDetails.gig_category?.name}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {gigDetails.skills.map((skill: { name: string }, i: number) => (
          <span key={`${i + 1}`} className="px-2 py-1 sm:px-3 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );

  const renderPriceSection = () => (
    <div className="flex items-center justify-between bg-white pt-4 border-t-2 border-gray-200">
      <div className="flex flex-col">
        <div className="text-left">
          <div className="text-xl sm:text-2xl font-bold text-green-600">${gigDetails.price}</div>
          <div className="text-xs sm:text-sm text-gray-500">in {gigDetails.payment_type === "fixed" ? "Fixed Price" : "Range"}</div>
        </div>
      </div>
      {(gigDetails?.user_id !== user_id && gigDetails.hasBid === false) && (
        <Button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-2 sm:px-4 sm:py-6 text-sm sm:text-md rounded-lg font-semibold"
        >
          Submit Bid
        </Button>
      )}
    </div>
  );

  const renderSidebar = () => (
    <div className="lg:col-span-1 order-2">
      <div className="h-full bg-white shadow rounded-lg p-4 sm:p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            {gigDetails.title}
          </h2>
          {renderGigInfo()}
        </div>
        {renderPriceSection()}
      </div>
    </div>
  );

  const renderTabNavigation = () => (
    <div className="bg-white w-full border-b border-gray-300">
      <div className="relative flex w-full">
        {["Description", "Certificates", "Bids"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`relative pb-3 px-3 sm:px-4 text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${activeTab === tab
              ? "text-[var(--base)] after:content-[''] after:absolute after:-bottom-[1px] after:left-0 after:w-full after:h-[2px] after:bg-[var(--base)]"
              : "text-gray-600 hover:text-[var(--base)]"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDescriptionTab = () => (
    <div className="pt-4 sm:pt-6">
      {gigDetails.description ? (
        <div className="max-w-none">
          <div className="whitespace-pre-line text-gray-700 leading-relaxed text-sm sm:text-base">
            {gigDetails.description}
          </div>
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center">
          <span className="text-gray-700 text-sm sm:text-base">No Description</span>
        </div>
      )}
    </div>
  );

  const renderCertificatesTab = () => (
    <div className="pt-4 sm:pt-6">
      <div className="space-y-3">
        {gigDetails.certifications.length > 0 ?
          gigDetails.certifications.map((cert: string, i: number) => (
            <div key={`${i + 1}`} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm sm:text-base">{cert}</span>
            </div>
          )) : (
            <div className="h-20 flex items-center justify-center">
              <span className="text-gray-700 text-sm sm:text-base">No Certificates</span>
            </div>
          )
        }
      </div>
    </div>
  );

  const renderBidCard = (bid: IBid) => (
    <Card key={bid.id} className="gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0 mb-4">
          <div className="flex items-start space-x-3 sm:space-x-4">
            {bid.provider.profile ? (
              <img
                alt="not found"
                src={bid.provider.profile}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-12 sm:h-12 bg-[var(--base)] text-white rounded-full flex items-center justify-center font-semibold text-lg sm:text-2xl flex-shrink-0">
                {bid.provider.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h4 className="font-semibold text-base sm:text-lg truncate">{bid.provider.name}</h4>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{bid.provider.avgRating}</span>
                    <span>({bid.provider.totalReview} reviews)</span>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{bid.provider.about}</p>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">${bid.bid_amount}</div>
            <div className="text-xs sm:text-sm text-gray-500">{bid.payment_type === "fixed" ? "Fixed Price" : "/Hour"}</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{bid.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <span className="text-xs sm:text-sm text-gray-500">Bid placed {formatDate(bid.created_at)}</span>
          {bid.status === "accepted" && (
            <div  className="bg-green-600 hover:bg-green-600 pt-[2px] text-white flex-1 sm:flex-initial h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
              Accepted
            </div>
          )}
          {user_id === bid.provider.id && bid.status !== "accepted" && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                className="text-white hover:text-white bg-[var(--base)] hover:bg-[var(--base)]"
                onClick={() => handleEditBid(bid)}
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
          {user_id === gigDetails.user_id && bid.status !== "accepted" && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full sm:w-auto">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Message
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-initial"
                >
                  Reject Bid
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptBid(bid.id)}
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                >
                  Accept Bid
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderBidsTab = () => {
    if (bidLoading) {
      return (
        <BidSkeletonList count={2} />
      );
    }
    if (bids.length === 0) {
      return (
        <div className="flex flex-col gap-4 sm:gap-5 mt-3">
          <div className="h-20 flex items-center justify-center">
            <span className="text-gray-700 text-sm sm:text-base">No Bids</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 sm:gap-5 mt-3">
        {bids.map((bid) => renderBidCard(bid))}
      </div>
    );
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case "Description":
        return renderDescriptionTab();
      case "Certificates":
        return renderCertificatesTab();
      case "Bids":
        return renderBidsTab();
      default:
        return null;
    }
  };

  if (!gigDetails) {
    return <GigDetailSkeleton />;
  }

  return (
    <div className="bg-gray-50">
      {renderHeader()}
      <main className="mx-auto py-4 sm:py-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
          {renderImageSlider()}
          {renderSidebar()}
        </div>
        <div className="mt-6 lg:mt-10 p-4 sm:p-6 shadow-lg rounded-lg bg-white">
          {renderTabNavigation()}
          {renderTabContent()}
        </div>
        <CommonFormModal
          width="600px"
          title="Bid Submission"
          open={isModalOpen}
          fields={gigBidFields}
          setOpen={setIsModalOpen}
          onSubmit={handleSubmitBid}
          initialValues={editBid || undefined}
          submitLabel={editBid ? "Update Bid" : "Submit Bid"}
        />
      </main>
    </div>
  );
};

export default GigDetail;