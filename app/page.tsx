"use client";

import React, { useEffect, useState } from "react";
import {
  Layout,
  Upload,
  Button,
  Card,
  List,
  Input,
  message,
  Spin,
  Typography,
  Empty,
} from "antd";
import {
  UploadOutlined,
  CommentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { UploadProps, RcFile } from "antd/es/upload";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

interface Photo {
  id: string;
  imageData: string;
  comments: Comment[];
}

export default function Home() {
  const [messageApi, contextHolder] = message.useMessage(); // Fix: Use hook for popups
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/photos", { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setPhotos(data);
      } else {
        setPhotos([]);
        console.error("API returned non-array:", data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      messageApi.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp";
    if (!isJpgOrPng) {
      messageApi.error("You can only upload JPG/PNG/WEBP files!");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error("Image must be smaller than 5MB!");
      return false;
    }
    return true;
  };

  const handleUploadRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64 = reader.result;

      try {
        const res = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64 }),
        });

        if (res.ok) {
          messageApi.success("Photo uploaded successfully");
          onSuccess("ok");
          fetchPhotos();
        } else {
          throw new Error("Server error");
        }
      } catch (err) {
        onError({ err });
        messageApi.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      messageApi.error("Failed to read image file");
      setUploading(false);
    };
  };

  const handleCommentSubmit = async (photoId: string) => {
    const content = commentInputs[photoId]?.trim();

    if (!content) {
      messageApi.warning("Please enter a message before posting!");
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, content }),
      });

      if (res.ok) {
        messageApi.success("Comment added");
        setCommentInputs((prev) => ({ ...prev, [photoId]: "" }));
        fetchPhotos();
      } else {
        throw new Error("Failed to post");
      }
    } catch (error) {
      messageApi.error("Could not post comment. Please try again.");
    }
  };

  const uploadProps: UploadProps = {
    customRequest: handleUploadRequest,
    beforeUpload: beforeUpload,
    showUploadList: false,
    accept: "image/*",
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Required for popups to show in Next.js App Router */}
      {contextHolder}

      <Header className="flex items-center bg-white shadow-sm px-8 sticky top-0 z-10">
        <Title level={4} style={{ margin: 0 }}>
          PhotoShare
        </Title>
      </Header>

      <Content className="p-6 max-w-2xl mx-auto w-full">
        <div className="bg-white p-8 rounded-lg shadow-sm mb-8 text-center border border-gray-100">
          <Upload {...uploadProps}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
            >
              Upload New Photo
            </Button>
          </Upload>
        </div>

        {loading ? (
          <div className="flex justify-center mt-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {photos.length === 0 && <Empty description="No photos yet" />}

            {photos.map((photo) => (
              <Card
                key={photo.id}
                cover={
                  <img
                    alt="user upload"
                    src={photo.imageData}
                    className="max-h-[600px] object-cover bg-black"
                  />
                }
                className="shadow-sm border-gray-200 overflow-hidden"
                styles={{ body: { padding: "16px" } }}
              >
                <List
                  className="mb-4"
                  header={
                    <div className="font-semibold text-gray-500 text-sm">
                      {photo.comments.length} Comments
                    </div>
                  }
                  itemLayout="horizontal"
                  dataSource={photo.comments}
                  renderItem={(item) => (
                    <List.Item className="!py-2 border-b-0">
                      <List.Item.Meta
                        avatar={
                          <UserOutlined className="bg-gray-100 p-2 rounded-full text-gray-400" />
                        }
                        title={
                          <Text strong className="text-sm">
                            {item.content}
                          </Text>
                        }
                        description={
                          <Text type="secondary" className="text-xs">
                            {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />

                <div className="flex gap-3">
                  <Input
                    placeholder="Add a comment..."
                    value={commentInputs[photo.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({
                        ...commentInputs,
                        [photo.id]: e.target.value,
                      })
                    }
                    onPressEnter={() => handleCommentSubmit(photo.id)}
                    className="rounded-md"
                  />
                  <Button
                    icon={<CommentOutlined />}
                    onClick={() => handleCommentSubmit(photo.id)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Content>
      <Footer className="text-center text-gray-400">
        © 2025 PhotoShare Assignment
      </Footer>
    </Layout>
  );
}
